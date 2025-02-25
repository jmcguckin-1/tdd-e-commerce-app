from Microservices.Cart import Cart
from Microservices.Search import Search
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter
import pytest


def cleanup_carts():
    # removing test carts from db
    print("cleaning carts")
    db = firestore.client()
    collection_ref = db.collection('cart')
    query = collection_ref.where(filter=FieldFilter("user", "==", 'test@gmail.com')).get()
    query2 = collection_ref.where(filter=FieldFilter("user", "==", 'test2@gmail.com')).get()
    # https://firebase.google.com/docs/firestore/manage-data/delete-data#python
    for document1 in query:
        document1.reference.delete()

    for document2 in query2:
        document2.reference.delete()


def cleanup_orders():
    # removing test orders from db
    print("cleaning orders")
    db = firestore.client()
    collection_ref = db.collection('orders')
    query = collection_ref.where(filter=FieldFilter("user", "==", 'test@gmail.com')).get()
    query2 = collection_ref.where(filter=FieldFilter("user", "==", 'test2@gmail.com')).get()
    # https://firebase.google.com/docs/firestore/manage-data/delete-data#python
    for document1 in query:
        document1.reference.delete()
    for document2 in query2:
        document2.reference.delete()


@pytest.mark.parametrize(('user', 'cart'), [
    # first item to cart
    ('test@gmail.com', {'user': 'test@gmail.com', 'list': [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}]}),
    # new user adding a cart
    ('test2@gmail.com', {'user': 'test2@gmail.com', 'list': [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}]}),
    # adding a different product
    ('test@gmail.com', {'productId': 'f0xuqF38n83LwZsfTTXd', 'quantity': 1, 'price': "£40.00"}),
    # adding the same product again
    ('test@gmail.com', {'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}),
])
def test_update_cart(cart, user):
    c = Cart()
    c.update_cart(cart, user)
    db = firestore.client()
    ref = db.collection('cart').where(filter=FieldFilter("user", "==", user)).get()
    # different pid and quantity format for first creation and updating
    pid = cart['list'][0]['productId'] if cart.get('list', []) else cart['productId']
    quantity = cart['list'][0]['quantity'] if cart.get('list', []) else cart['quantity']
    ind = 1 if not cart.get('list', []) else 0
    if ref:
        for doc in ref:
            new_cart = doc.to_dict()
            items = new_cart['list']
            assert new_cart['user'] == user
            assert len(items) > 0
            if pid in items[0]['productId']:
                assert items[0]['quantity'] > quantity or items[0]['quantity'] == quantity
            else:
                assert pid == items[ind]['productId']
                assert quantity == items[ind]['quantity']


@pytest.mark.parametrize(('user', 'cart'), [
    ('test@gmail.com', {'productId': 'f0xuqF38n83LwZsfTTXd', 'quantity': 11, 'price': "£40.00"})
])
def test_update_cart_quantity_handling(user, cart):
    c = Cart()
    c.update_cart(cart, user)
    db = firestore.client()
    ref = db.collection('cart').where(filter=FieldFilter("user", "==", user)).get()
    # different pid and quantity format for first creation and updating
    pid = cart['productId']
    quantity = cart['quantity']
    ind = 1
    if ref:
        for doc in ref:
            new_cart = doc.to_dict()
            items = new_cart['list']
            assert pid == items[ind]['productId']
            assert items[ind]['quantity'] < quantity


@pytest.mark.parametrize(('user', 'cart', 'msg', 'exc_type'), [
    ('', {'user': '', 'list': [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}]}, 'Users must have an email!',
     ValueError),
    ('jmcguckin00@gmail.com', 25, 'User should be a string, cart should be a dictionary', TypeError),
    ('jmcguckin00@gmail.com', {}, 'Cart should not be empty', ValueError),
])
def test_update_cart_exceptions(user, cart, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        c = Cart()
        c.update_cart(cart, user)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('user', 'items', 'categories', 'chosen'), [
    ('test@gmail.com', ['Alan Wake 2', 'Animal Crossing: NH'],
     ['PS5 Games', 'Nintendo Switch Games'], [4, 8]),
    ('test2@gmail.com', ['Alan Wake 2'], ['PS5 Games', 'Nintendo Switch Games'], [2]),
])
def test_get_cart_contents(user, items, categories, chosen):
    c = Cart()
    data = c.get_cart(user, 'en')

    if data:
        global counter
        counter = 0
        for item in data:
            assert item['chosen_quantity'] == chosen[counter]
            assert item['name'] == items[counter]
            assert item['category'] == categories[counter]
            if len(items) > 1:
                counter += 1


@pytest.mark.parametrize(('user', 'msg', 'exc_type'), [
    ('', 'Users must have an email!', ValueError),
    (24.5, "User's email should be a str", TypeError),
    ('jmcguckin00@yahoo.com', 'Emails should end in @gmail.com', ValueError),
])
def test_get_cart_contents_exceptions(user, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        c = Cart()
        c.get_cart(user, 'en')
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('user', 'expected_total', 'lang'), [
    ('test@gmail.com', '£587.40', 'en'),
    ('test2@gmail.com', '£117.90', 'en'),
    ('test2@gmail.com', '€117.90', 'fr'),
])
def test_get_cart_price(user, expected_total, lang):
    c = Cart()
    data = c.get_cart_total(user, lang)
    total_price = data[0]['cart_total_price']
    assert total_price == expected_total


@pytest.mark.parametrize(('user', 'expected'), [
    ('test@gmail.com', True),
    ('nobody@gmail.com', False)
])
def test_get_cart_presence(user, expected):
    c = Cart()
    data = c.get_presence(user)
    if expected:
        assert len(data) > 0
        for item in data:
            assert 'productId' in item
            assert 'quantity' in item
    else:
        assert data == []


@pytest.mark.parametrize(('user', 'msg', 'exc_type'), [
    ('', 'Users must have an email!', ValueError),
    (24.5, "User's email should be a str", TypeError),
    ('jmcguckin00@yahoo.com', 'Emails should end in @gmail.com', ValueError),
])
def test_get_cart_presence_exceptions(user, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        c = Cart()
        c.get_presence(user)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('user', 'msg', 'exc_type'), [
    ('', 'Users must have an email!', ValueError),
    (24.5, "User's email should be a str", TypeError),
    ('jmcguckin00@yahoo.com', 'Emails should end in @gmail.com', ValueError),
])
def test_get_cart_total_exceptions(user, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        c = Cart()
        c.get_cart_total(user, 'en')
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('amount', 'currency', 'method'), [
    ('40.00', 'GBP', 'paypal'),  # paying £40 with paypal
    ('50.00', 'EUR', 'paypal'),  # paying 50 euros
])
def test_process_paypal_valid_input(amount, currency, method):
    c = Cart()
    data = c.process_paypal_payment(amount, currency, method)
    assert data[0]['status'] == 'success'
    assert 'https://www.sandbox.paypal.com' in data[0]['approval_url']


@pytest.mark.parametrize(('amount', 'currency', 'method', 'issue'), [
    ('50.00', '£', 'paypal', 'Currency should be a valid ISO currency code'),  # wrong currency format
    ('abc', 'EUR', 'credit_card', 'Cannot construct instance of `com.paypal.platform.payments.model.rest.common.Amount`, problem: INVALID_CURRENCY_AMOUNT_FORMAT'),  # wrong amount format
    ('50.00', 'GBP', 'cash', 'cash is invalid value. Supported values are CREDIT_CARD, PAYPAL, BANK, CARRIER, ALTERNATE_PAYMENT, PAY_UPON_INVOICE'),  # wrong method
])
def test_process_paypal_invalid_input(amount, currency, method, issue):
    c = Cart()
    data = c.process_paypal_payment(amount, currency, method)
    assert data[0]['error']['name'] == 'VALIDATION_ERROR'
    assert data[0]['error']['details'][0]['issue'] == issue


@pytest.mark.parametrize(('user', 'cart', 'items'), [
    ('test@gmail.com', [{'productId': '0eeIxfjtYRf9eBXEv5AU', 'quantity': 1}], 1),
    ('test2@gmail.com', [{'productId': '0eeIxfjtYRf9eBXEv5AU', 'quantity': 1},
                         {'productId': '54rTYexWARbuFuDrfThK', 'quantity': 1}], 2),
])
def test_place_order(user, cart, items):
    c = Cart()
    c.place_order(user, cart, 'en')
    db = firestore.client()
    ref = db.collection('orders').where(filter=FieldFilter("user", "==", user)).get()
    if ref:
        for doc in ref:
            new_order = doc.to_dict()
            assert new_order['user'] == user
            for i in range(0, items):
                assert new_order['cart'][i]['productId'] == cart[i]['productId']
                assert new_order['cart'][i]['quantity'] == cart[i]['quantity']


@pytest.mark.parametrize(('user', 'cart', 'msg', 'exc_type'), [
    ('',  [{'productId': '0eeIxfjtYRf9eBXEv5AU', 'quantity': 1}], 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', 25, 'User should be a string, cart should be a list', TypeError),
    ('jmcguckin00@gmail.com', [], 'Cart must not be empty', ValueError),
])
def test_place_order_exceptions(user, cart, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        c = Cart()
        c.place_order(user, cart, 'en')
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('pid', 'in_stock'), [
    ('54rTYexWARbuFuDrfThK', False),
    ('p7wyGwbum3JJQ9a5MYLS', True)
])
def test_out_of_stock(pid, in_stock):
    c = Cart()
    data = c.out_of_stock(pid)
    if in_stock:
        assert data[0]['stock'] == 'in stock'
        assert data[0]['quantity'] > 0
    else:
        assert data[0]['stock'] == 'out of stock'


@pytest.mark.parametrize(('pid', 'msg', 'exc_type'), [
    ('',  'must be a valid product id', ValueError),
    (25, 'PID should be a string', TypeError),
])
def test_stock_exceptions(pid, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        c = Cart()
        c.out_of_stock(pid)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('user', 'cart', 'size'), [
    ('test@gmail.com',  [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}, {'productId': 'f0xuqF38n83LwZsfTTXd', 'quantity': 1}], 2),
    ('test2@gmail.com', [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 3}], 1),
    ('test@gmail.com', [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 0}, {'productId': 'f0xuqF38n83LwZsfTTXd', 'quantity': 0}], 2),
])
def test_update_cart_menu(user, cart, size):
    c = Cart()
    c.update_cart_menu(cart, user)
    db = firestore.client()
    ref = db.collection('cart').where(filter=FieldFilter("user", "==", user)).get()
    for doc in ref:
        new_cart = doc.to_dict()
        new_list = new_cart['list']
        for i in range(0, size):
            assert new_list[i]['quantity'] == cart[i]['quantity']


@pytest.mark.parametrize(('user', 'cart', 'msg', 'exc_type'), [
    ('',  [{'productId': '0eeIxfjtYRf9eBXEv5AU', 'quantity': 1}], 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com',  [], 'Cart should not be empty', ValueError),
    (False, [{'productId': '0eeIxfjtYRf9eBXEv5AU', 'quantity': 1}], 'User should be a string, cart should be a list', TypeError),
])
def test_update_cart_menu_exceptions(user, cart, msg, exc_type):
    if not user:
        cleanup_carts()
        cleanup_orders()
    with pytest.raises(Exception) as exception_msg:
        c = Cart()
        c.update_cart_menu(cart, user)
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg
