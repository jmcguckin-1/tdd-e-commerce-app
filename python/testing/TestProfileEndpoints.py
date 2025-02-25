from api import app
import pytest
import json
import requests
from Microservices.Search import Search
from Microservices.Profile import Profile
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter


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
        # https://firebase.google.com/docs/firestore/manage-data/add-data#update-data
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
        for doc1 in query3:
            doc1.reference.delete()


@pytest.mark.parametrize(('user', 'expected_outcome'), [
    ('jmcguckin00@gmail.com', True),  # valid manual account
    ('jmcguckin308@gmail.com', True),  # valid automated Google account
    ('jamesmonaghan@yahoo.com', False),  # invalid manual account
])
def test_get_user_details(user, expected_outcome):
    client = app.test_client()
    cleanup_details()
    response = client.get(f'/get_details?user={user}')
    if expected_outcome:
        assert response.status_code == 200
        data = json.loads(response.data.decode('utf-8'))
        details = [data[0]['name'], data[0]['email']]
        for item in details:
            assert item is not None


@pytest.mark.parametrize(('user', 'details_list', 'key'), [
    ('jmcguckin07@gmail.com', {"name": "John McG", "email": "jmcguckin07@gmail.com"}, 'name'),  # change name
    ('jmcguckin07@gmail.com',
     {"name": "John M", "email": "jmcguckin07@gmail.com", "addr_line_one": "80 University Road"}, 'addr_line_one'),
    # address line one
    ('jmcguckin07@gmail.com', {"name": "John M", "email": "jmcguckin07@gmail.com", "city": "Belfast"}, 'city'),  # city
    ('jmcguckin07@gmail.com', {"name": "John M", "email": "jmcguckin07@gmail.com", "country": "United Kingdom"},
     'country'),  # country
    ('jmcguckin07@gmail.com', {"name": "John M", "email": "jmcguckin07@gmail.com", "postcode": "BT 71"}, 'postcode'),
    # postcode
])
def test_change_details(user, details_list, key):
    client = app.test_client()
    js_data = {'user': user, "details": details_list}
    response = client.post(f'/change_details', json=js_data)
    assert response.status_code == 200
    db = firestore.client()

    ref = db.collection('user').where(filter=FieldFilter("email", "==", user)).get()
    if ref:
        for doc in ref:
            user = doc.to_dict()
            assert user[key] == details_list[key]


@pytest.mark.parametrize(('user', 'details_list'), [
    ('jmcguckin00@gmail.com', {"name": "John McG", "email": "jmcguckinABCD@gmail.com"}),  # change email
])
def test_change_email(user, details_list):
    client = app.test_client()
    js_data = {'user': user, "details": details_list}
    response = client.post(f'/change_details', json=js_data)
    assert response.status_code == 200
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


@pytest.mark.parametrize(('user', 'details_list', 'expected', 'exc_type'), [
    ('', {"name": "John McG", "email": "jmcguckinABCD@gmail.com"}, 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', {"name": "", "email": "jmcguckinABCD@gmail.com"}, 'Name and email should not be blank', ValueError),
    ('jmcguckin00@gmail.com', {"name": "John M", "email": ""}, 'Name and email should not be blank', ValueError),
    ('jmcguckin00@gmail.com', {"name": "John M", "email": "jmcguckin@outlook.com"}, 'Emails should end in @gmail.com', ValueError),
    ('jmcguckin00@gmail.com', 12345, 'Wrong type passed in for user (str) or details_list (dict)', TypeError),
])
def test_invalid_change_details(user, details_list, expected, exc_type):
    with pytest.raises(Exception) as exception_msg:
        client = app.test_client()
        js_data = {'user': user, "details": details_list}
        response = client.post(f'/change_details', json=js_data)
        assert response.status_code == 500
        assert isinstance(exception_msg.value, exc_type)
        assert str(exception_msg.value) == expected


@pytest.mark.parametrize('user', [
    'jmcguckinABCD@gmail.com',  # valid manual email
])
def test_send_password_reset(user):
    client = app.test_client()
    js_data = {'user': user, 'lang': 'en'}
    response = client.post(f'/send_password_reset', json=js_data)
    assert response.status_code == 200
    db = firestore.client()
    ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
    if ref:
        for doc in ref:
            user = doc.to_dict()
            assert len(user['password_code']) == 4
            assert user['password_code'] is not None


@pytest.mark.parametrize(('user', 'expected'), [
    ('jmcguckinABCD@gmail.com', "code match"),  # matching code
])
def test_validate_user(user, expected):
    client = app.test_client()
    db = firestore.client()
    input_code = ""
    ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
    if ref:
        for doc in ref:
            user_ref = doc.to_dict()
            if expected == "code match":
                input_code = user_ref['password_code']
    js_data = {'user': user, 'input': input_code}
    response = client.post(f'/validate_user', json=js_data)
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data[0]['result'] == expected


@pytest.mark.parametrize(('user', 'expected'), [
    ('jmcguckinABCD@gmail.com', True),
    ('jmonaghan@gmail.com', False),

])
def test_get_order_history(user, expected):
    client = app.test_client()
    response = client.get(f'/get_order_history?user={user}')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    if not expected:
        assert data == []
    else:
        for i in range(0, len(data)):
            assert len(data[i]) > 0
            assert data[i]['cart_items'] is not None
            for k in range(0, len(data[i]['images'])):
                assert 'http://localhost:5000/images' in data[i]['images'][k]


@pytest.mark.parametrize(('user', 'expected'), [
    ('jmcguckinABCD@gmail.com', "code match"),
])
def test_validate_discount_code(user, expected):
    client = app.test_client()
    db = firestore.client()
    p = Profile()
    p.generate_discount_code(user, 'en')
    input_code = ""
    ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
    if ref:
        for doc in ref:
            user_ref = doc.to_dict()
            if expected == "code match":
                input_code = user_ref['code']
    js_data = {'user': user, 'code': input_code}
    response = client.post(f'/validate_code', json=js_data)
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    assert data[0]['result'] == expected


@pytest.mark.parametrize(('user', 'price', 'expected'), [
    ('jmcguckinABCD@gmail.com', "£50.00", "£45.0")
])
def test_apply_discount_code(user, price, expected):
    client = app.test_client()
    db = firestore.client()
    js_data = {'user': user, 'price': price, 'lang': 'en'}
    response = client.post(f'/apply_discount_code', json=js_data)
    data = json.loads(response.data.decode('utf-8'))
    assert response.status_code == 200
    assert data[0]["new_price"] == expected
    ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
    if ref:
        for doc in ref:
            user_ref = doc.to_dict()
            assert 'discount_status' not in user_ref


@pytest.mark.parametrize(('user', 'code', 'expected', 'exc_type'), [
    ('', '13456567', 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', '', 'Code must be entered!', ValueError),
    ('jmcguckin00@gmail.com', '123', 'Code must have a length of 8!', ValueError),
    (54, '12345678', 'Validate code only accepts strings!', TypeError),
])
def test_invalid_code(user, code, expected, exc_type):
    if not user:
        cleanup_details()
    with pytest.raises(Exception) as exception_msg:
        client = app.test_client()
        js_data = {'user': user, 'code': code}
        response = client.post(f'/validate_code', json=js_data)
        assert response.status_code == 500
        assert isinstance(exception_msg.value, exc_type)
        assert str(exception_msg.value) == expected
