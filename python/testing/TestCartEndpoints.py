from api import app
import pytest
import json
import requests
from Microservices.Search import Search
from Microservices.Profile import Profile
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter


def cleanup_carts():
    # removing test carts from db
    print("cleaning carts")
    db = firestore.client()
    collection_ref = db.collection('cart')
    query = collection_ref.where(filter=FieldFilter("user", "==", 'test3@gmail.com')).get()
    query2 = collection_ref.where(filter=FieldFilter("user", "==", 'test4@gmail.com')).get()
    for document1 in query:
        document1.reference.delete()

    for document2 in query2:
        document2.reference.delete()


@pytest.mark.parametrize(('user', 'cart'), [
    ('test3@gmail.com', [{'user': 'test3@gmail.com', 'list': [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}]}]), # first item to cart
    ('test4@gmail.com', [{'user': 'test4@gmail.com', 'list': [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}]}]),  # new user adding a cart
    ('test3@gmail.com', [{'productId': 'f0xuqF38n83LwZsfTTXd', 'quantity': 1, 'price': "£40.00"}]),   # adding a different product
    ('test3@gmail.com', [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2,}]),   # adding the same product again
])
def test_update_cart(cart, user):
    client = app.test_client()
    js_data = {
        'cart': cart,
        'user': user
    }
    response = client.post(f'/update_cart', json=js_data)
    assert response.status_code == 200
    db = firestore.client()
    ref = db.collection('cart').where(filter=FieldFilter("user", "==", user)).get()
    pid = cart[0]['list'][0]['productId'] if 'list' in cart[0] else cart[0]['productId']
    quantity = cart[0]['list'][0]['quantity'] if 'list' in cart[0] else cart[0]['quantity']
    ind = 1 if 'list' not in cart else 0
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


@pytest.mark.parametrize(('user', 'cart', 'msg', 'exc_type'),[
    ('', {'user': '', 'list': [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}]}, 'Users must have an email!', ValueError),
    ('jmcguckin00@gmail.com', 25, 'User should be a string, cart should be a dictionary', TypeError),
    ('jmcguckin00@gmail.com', {}, 'Cart should not be empty', ValueError),
])
def test_update_cart_exceptions(user, cart, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        client = app.test_client()
        js_data = {
            'cart': cart,
            'user': user
        }
        response = client.post(f'/update_cart', json=js_data)
        assert response.status_code == 500
        assert isinstance(exception_msg.value, exc_type)
        assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('user', 'items', 'categories', 'chosen'), [
    ('test3@gmail.com', ['Alan Wake 2', 'Animal Crossing: NH'], ['PS5 Games', 'Nintendo Switch Games'], [4, 1]),
    ('test4@gmail.com', ['Alan Wake 2'], ['PS5 Games', 'Nintendo Switch Games'], [2]),
])
def test_get_contents(user, items, categories, chosen):
    client = app.test_client()
    response = client.get(f'/get_cart_contents?user={user}&lang=en')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))

    if data:
        global counter
        counter = 0
        for item in data:
            assert item['chosen_quantity'] == chosen[counter]
            assert item['name'] == items[counter]
            assert item['category'] == categories[counter]
            if len(items) > 1:
                counter += 1
    else:
        assert data == []


@pytest.mark.parametrize(('user', 'msg', 'exc_type'), [
    ('', 'Users must have an email!', ValueError),
    (24.5, "User's email should be a str", TypeError),
    ('jmcguckin00@yahoo.com', 'Emails should end in @gmail.com', ValueError),
])
def test_get_cart_exceptions(user, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        client = app.test_client()
        response = client.get(f'/get_cart_contents?user={user}&lang=en')
        assert response.status_code == 500
        assert isinstance(exception_msg.value, exc_type)
        assert str(exception_msg.value) == msg


# price method
@pytest.mark.parametrize(('user', 'expected_total'), [
    # ('test3@gmail.com', '£235.80'),
    ('test4@gmail.com', '£117.90'),
])
def test_get_cart_price(user, expected_total):
    client = app.test_client()
    response = client.get(f'/get_cart_total?user={user}&lang=en')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    total_price = data[0]['cart_total_price']
    assert total_price == expected_total


@pytest.mark.parametrize(('user', 'msg', 'exc_type'), [
    ('', 'Users must have an email!', ValueError),
    (24.5, "User's email should be a str", TypeError),
    ('jmcguckin00@yahoo.com', 'Emails should end in @gmail.com', ValueError),
])
def test_get_cart_total_exceptions(user, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        client = app.test_client()
        response = client.get(f'/get_cart_total?user={user}&lang=en')
        assert response.status_code == 500
        assert isinstance(exception_msg.value, exc_type)
        assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('user', 'cart', 'size'), [
    ('test3@gmail.com',  [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 2}, {'productId': 'f0xuqF38n83LwZsfTTXd', 'quantity': 1}], 2),
    ('test4@gmail.com', [{'productId': 'h44nwXrHliy3BUupf0r5', 'quantity': 3}], 1),
])
def test_update_cart_menu(user, cart, size):
    client = app.test_client()
    js_data = {
        'cart': cart,
        'user': user
    }
    response = client.post(f'/update_cart_menu', json=js_data)
    assert response.status_code == 200
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
    with pytest.raises(Exception) as exception_msg:
        client = app.test_client()
        js_data = {
            'cart': cart,
            'user': user
        }
        response = client.post(f'/update_cart_menu', json=js_data)
        assert response.status_code == 200
        assert isinstance(exception_msg.value, exc_type)
        assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('pid', 'in_stock'), [
    ('54rTYexWARbuFuDrfThK', False),
    ('p7wyGwbum3JJQ9a5MYLS', True)
])
def test_out_of_stock(pid, in_stock):
    cleanup_carts()
    client = app.test_client()
    response = client.get(f'/out_of_stock?product={pid}')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
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
        client = app.test_client()
        response = client.get(f'/out_of_stock?product={pid}')
        assert response.status_code == 500
        assert isinstance(exception_msg.value, exc_type)
        assert str(exception_msg.value) == msg
