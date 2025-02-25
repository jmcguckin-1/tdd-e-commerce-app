from Microservices.Cart import Cart
from Microservices.Search import Search
from Microservices.Profile import Profile
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter
import pytest


def cleanup_details():
    # resetting details after tests
    print("cleaning details changes")
    db = firestore.client()
    user = 'jmcguckinABCD@gmail.com'
    query = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
    query1 = db.collection('cart').where(filter=FieldFilter("user", "==", user)).get()
    query2 = db.collection('orders').where(filter=FieldFilter("user", "==", user)).get()
    query3 = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
    if query:
        for doc in query:
            user_ref = db.collection('users').document(doc.id)
            user_ref.update({"email": "jmcguckin00@gmail.com"})
    if query1:
        for doc in query1:
            user_ref = db.collection('cart').document(doc.id)
            user_ref.update({"user": "jmcguckin00@gmail.com"})
    if query2:
        for doc in query2:
            user_ref = db.collection('orders').document(doc.id)
            user_ref.update({"user": "jmcguckin00@gmail.com"})
    if query3:
        for doc in query3:
            doc.reference.delete()


@pytest.mark.parametrize(('user', 'expected_outcome'), [
    ('jmcguckin00@gmail.com', True),  # valid manual account
    ('jmcguckin308@gmail.com', True),  # valid automated Google account
])
def test_get_user_details(user, expected_outcome):
    p = Profile()
    results = p.get_user_details(user)
    if expected_outcome:
        details = [results[0]['name'], results[0]['email']]
        for item in details:
            assert item is not None
    else:
        assert results is None


@pytest.mark.parametrize(('user', 'details_list', 'key'), [
    # change name
    ('jmcguckin00@gmail.com', {"name": "John McG", "email": "jmcguckin00@gmail.com"}, 'name'),
    # address line one
    ('jmcguckin00@gmail.com',
     {"name": "John M", "email": "jmcguckin00@gmail.com", "addr_line_one": "80 University Road"}, 'addr_line_one'),
    # city
    ('jmcguckin00@gmail.com', {"name": "John M", "email": "jmcguckin00@gmail.com", "city": "Belfast"}, 'city'),
    # country
    ('jmcguckin00@gmail.com', {"name": "John M", "email": "jmcguckin00@gmail.com", "country": "United Kingdom"},
     'country'),
    # postcode
    ('jmcguckin00@gmail.com', {"name": "John M", "email": "jmcguckin00@gmail.com", "postcode": "BT 71"}, 'postcode'),

])
def test_change_details(user, details_list, key):
    p = Profile()
    p.change_details(user, details_list)
    db = firestore.client()
    ref = db.collection('user').where(filter=FieldFilter("email", "==", user)).get()
    if ref:
        for doc in ref:
            user = doc.to_dict()
            assert user[key] == details_list[key]


@pytest.mark.parametrize(('user', 'details_list', 'expected', 'exc_type'), [
    ('', {"name": "John McG", "email": "jmcguckinABCD@gmail.com"}, 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', {"name": "", "email": "jmcguckinABCD@gmail.com"}, 'Name and email should not be blank', ValueError),
    ('jmcguckin00@gmail.com', {"name": "John M", "email": ""}, 'Name and email should not be blank', ValueError),
    ('jmcguckin00@gmail.com', {"name": "John M", "email": "jmcguckin@outlook.com"}, 'Emails should end in @gmail.com', ValueError),
    ('jmcguckin00@gmail.com', 12345, 'Wrong type passed in for user (str) or details_list (dict)', TypeError),
])
def test_invalid_change_details(user, details_list, expected, exc_type):
    with pytest.raises(Exception) as exception_msg:
        p = Profile()
        p.change_details(user, details_list)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == expected


@pytest.mark.parametrize(('user', 'details_list'), [
    ('jmcguckin00@gmail.com', {"name": "John McG", "email": "jmcguckinABCD@gmail.com"}),
])
def test_change_email(user, details_list):
    p = Profile()
    p.change_details(user, details_list)
    db = firestore.client()

    ref1 = db.collection('cart').where(filter=FieldFilter("user", "==", details_list['email'])).get()
    ref2 = db.collection('orders').where(filter=FieldFilter("user", "==", details_list['email'])).get()
    items_list = [ref1, ref2]
    for items in items_list:
        # if the refs are found, then it means that the cart and order tables have updated with new email
        if items:
            for doc in items:
                user = doc.to_dict()
                assert user['user'] == details_list['email']


@pytest.mark.parametrize('user', [
    'jmcguckinABCD@gmail.com',  # valid manual email
])
def test_send_password_reset(user):
    p = Profile()
    p.send_password_reset(user, 'en')
    db = firestore.client()
    ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
    if ref:
        for doc in ref:
            user = doc.to_dict()
            assert len(user['password_code']) == 4
            assert user['password_code'] is not None


@pytest.mark.parametrize(('user', 'lang', 'expected', 'exc_type'), [
    ('', 'en', 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', '', 'Language must not be blank', ValueError),
    ('jmcguckin00@gmail.com', 'sp', 'Language must be fr or en', ValueError),
    (54, 'fr', 'Send password reset only accepts strings!', TypeError),
])
def test_invalid_password_reset(user, lang, expected, exc_type):
    with pytest.raises(Exception) as exception_msg:
        p = Profile()
        p.send_password_reset(user, lang)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == expected


@pytest.mark.parametrize(('user', 'expected'), [
    ('jmcguckinABCD@gmail.com', "code match"),  # matching code
])
def test_validate_user(user, expected):
    p = Profile()
    db = firestore.client()
    input_code = ""
    ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
    if ref:
        for doc in ref:
            user_ref = doc.to_dict()
            if expected == "code match":
                input_code = user_ref['password_code']
    data = p.validate_user(user, input_code)
    assert data[0]['result'] == expected


@pytest.mark.parametrize(('user', 'code', 'expected', 'exc_type'), [
    ('', '3456', 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', '', 'Input cannot be blank!', ValueError),
    ('jmcguckin00@gmail.com', '123', 'Input must have a length of 4', ValueError),
    ('jmcguckin00@gmail.com', 45, 'Validate user only accepts strings!', TypeError)
])
def test_invalid_user(user, code, expected, exc_type):
    with pytest.raises(Exception) as exception_msg:
        p = Profile()
        p.validate_user(user, code)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == expected


@pytest.mark.parametrize(('user', 'expected'), [
    ('jmcguckinABCD@gmail.com', True),
    ('jmcguckin308@gmail.com', True),
    ('jmonaghan@gmail.com', False),
])
def test_get_order_history(user, expected):
    p = Profile()
    data = p.get_order_history(user, 'fr')
    if not expected:
        assert data == []
    else:
        for i in range(0, len(data)):
            assert len(data[i]) > 0
            assert data[i]['cart_items'] is not None
            for k in range(0, len(data[i]['images'])):
                assert 'http://localhost:5000/images' in data[i]['images'][k]


@pytest.mark.parametrize('user', [
    'jmcguckinABCD@gmail.com',  # valid discount code user

])
def test_generate_discount_code(user):
    p = Profile()
    p.generate_discount_code(user, 'en')
    db = firestore.client()
    ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
    if ref:
        for doc in ref:
            user_item = doc.to_dict()
            assert user_item['code'] is not None
            assert user_item['user'] == user
            assert len(user_item['code']) == 8
    else:
        ref = db.collection('users').where(filter=FieldFilter("user", "==", user)).get()
        if ref:
            for doc in ref:
                user_item = doc.to_dict()
                if 'num_purchases' in user_item:
                    assert user_item['num_purchases'] % 10 != 0


@pytest.mark.parametrize(('user', 'lang', 'expected', 'exc_type'), [
    (234, 'en', 'Generate discount code only accepts strings!', TypeError),
    ('', 'en', 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', '', 'Language must not be blank', ValueError),
    ('jmcguckin00@gmail.com', 'sp', 'Language must be fr or en', ValueError)
])
def test_invalid_gen_discount_code(user, lang, expected, exc_type):
    with pytest.raises(Exception) as exception_msg:
        p = Profile()
        p.generate_discount_code(user, lang)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == expected


@pytest.mark.parametrize(('user', 'expected'), [
    ('jmcguckinABCD@gmail.com', "code match"),  # matching code
])
def test_validate_discount_code(user, expected):
    p = Profile()
    db = firestore.client()
    input_code = ""
    ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
    if ref:
        for doc in ref:
            user_ref = doc.to_dict()
            if expected == "code match":
                input_code = user_ref['code']
    data = p.validate_code(user, input_code)
    assert data[0]['result'] == expected


@pytest.mark.parametrize(('user', 'code', 'expected', 'exc_type'), [
    ('', '13456567', 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', '', 'Code must be entered!', ValueError),
    ('jmcguckin00@gmail.com', '123', 'Code must have a length of 8!', ValueError),
    (54, '12345678', 'Validate code only accepts strings!', TypeError),
])
def test_invalid_code(user, code, expected, exc_type):
    with pytest.raises(Exception) as exception_msg:
        p = Profile()
        p.validate_code(user, code)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == expected


@pytest.mark.parametrize(('user', 'price', 'msg', 'expected'), [
    ('', '£50.00', 'Neither variable should be blank!', ValueError),
    ('jmcguckin00@gmail.com', 12.23, 'Apply discount code only accepts strings!', TypeError),
    ('jmcguckin00@gmail.com', "-£10", 'Minus values are not allowed!', ValueError),
    ('jmcguckin00@gmail.com', "£0.00", 'Price should not be 0!', ValueError),

])
def test_apply_discount_exception(user, price, msg, expected):
    with pytest.raises(Exception) as exception_msg:
        p = Profile()
        p.apply_discount_code(user, price, 'en')
    assert isinstance(exception_msg.value, expected)
    assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('user', 'price', 'expected'), [
    ('jmcguckinABCD@gmail.com', "£50.00", "£45.0")
])
def test_apply_discount_code(user, price, expected):
    p = Profile()
    db = firestore.client()
    data = p.apply_discount_code(user, price, 'en')
    assert data[0]["new_price"] == expected
    ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
    if ref:
        for doc in ref:
            user_ref = doc.to_dict()
            assert 'discount_status' not in user_ref
        cleanup_details()
