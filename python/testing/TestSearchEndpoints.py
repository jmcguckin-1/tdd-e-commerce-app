from api import app
import pytest
import json
import requests
from Microservices.Search import Search
from Microservices.Profile import Profile
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter


@pytest.mark.parametrize('param', [
    'PS5',
    'all',
    'Xbox',
    'NS'
])
def test_get_product_inventory(param):
    client = app.test_client()
    response = client.get(f'/get_product_inventory/{param}/user/en')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    for item in data:
        if param != "all" and param != "NS":
            assert param in item.get('category')
        elif param == "NS":
            assert "Nintendo Switch Games" == item.get('category')
        else:
            assert item.get('name') is not None


@pytest.mark.parametrize('param', [
    'Zelda',  # searching for a keyword
    'God of War Ragnarok',  # searching for an exact match
    'SpIdEr-mAn',  # different cases throughout the term
    'mario'  # searching for a lowercase keyword
])
def test_search_endpoint(param):
    client = app.test_client()
    response = client.get(f'/search/{param}/en')

    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    for item in data:
        assert str.lower(param) in str.lower(item.get('name'))


@pytest.mark.parametrize('param', [
    '', # empty search term
    '12', # number input
    '@',  # symbols that shouldn't be allowed
    'abc' # random letters
])
def test_search_endpoint_invalid_input(param):
    client = app.test_client()
    response = client.get(f'/search/{param}/en')

    if param != "":
        assert response.status_code == 200
        data = json.loads(response.data.decode('utf-8'))
        assert data == []
    else:
        assert response.status_code == 404


@pytest.mark.parametrize(('category', 'price', 'expected'), [
       (['PS5 Games'], [45, 60], "PS5 Games"),
       (["Xbox Games"], [45, 60], "Xbox Games"),
       (['Nintendo Switch Games'], [45, 60], "Nintendo Switch Games"),
       (['Xbox Games', 'PS5 Games', 'Nintendo Switch Games'], [45, 60], ""),
       (["Nintendo Switch Games", "PS5 Games"], [45, 60], ""),
])
def test_filter_endpoint_expected_functionality(category, price, expected):
    client = app.test_client()
    js_data = {
        'category': category,
        'price': price,
        'delivery': ["free"],
        'lang': "en"
    }
    response = client.post(f'/filter', json=js_data)

    assert response.status_code == 200

    data = json.loads(response.data.decode('utf-8'))
    for item in data:
        if len(category) == 1:
            assert item.get('category') == expected
        else:
            assert item.get('category') in category


@pytest.mark.parametrize(('category', 'price', 'delivery', 'msg', 'exc_type'), [
    ([], [45, 60], ['free'], "Lists should not be empty", ValueError),
    (["PS5"], "123", ['standard'], 'Filter method should accept lists only', TypeError)
])
def test_filter_api_invalid(category, price, delivery, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        client = app.test_client()
        js_data = {
            'category': category,
            'price': price,
            'delivery': delivery,
            'lang': "en"
        }
        response = client.post(f'/filter', json=js_data)

        assert response.status_code == 500
        assert isinstance(exception_msg.value, exc_type)
        assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('category', 'price'), [
       (['PS5 Games'], [30, 40]),
       (["Xbox Games"], [45, 60],),
       (['Nintendo Switch Games'], [45, 70]),
       (['Xbox Games', 'PS5 Games', 'Nintendo Switch Games'], [70, 80]),
       (["Nintendo Switch Games", "PS5 Games"], [30, 50])
])
def test_filter_endpoint_price_ranges(category, price):
    client = app.test_client()
    js_data = {
        'category': category,
        'price': price,
        'delivery': ['free'],
        'lang': "en"
    }
    response = client.post(f'/filter', json=js_data)

    assert response.status_code == 200

    data = json.loads(response.data.decode('utf-8'))
    for item in data:
        assert price[0] <= float(item.get('price')[1:len(item.get('price'))]) <= price[1]


@pytest.mark.parametrize(('sort_term', 'field', "direction"), [
    ("trending", "times_clicked", "desc"), # sort by popular items
    ("price-high", "price", "desc"),     # sort by highest-lowest price
    ("alpha", "name", "asc"),  # sort by alphabetical order
    ("price-low", "price", "asc"), # sort by lowest-highest price
    ("age-low", "age_rating", "asc"), # sort by lowest-highest age_rating
    ("age-high", "age_rating", "desc") # sort by highest-lowest age_rating
])
def test_sort_all_items(sort_term, field, direction):
    client = app.test_client()
    response = client.get(f'/sort/{sort_term}/All/en')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    for i in range(0, len(data) - 1):
        if direction == "asc":
            assert data[i][field] <= data[i + 1][field]
        else:
            assert data[i][field] >= data[i + 1][field]


# test for ensuring we can sort on individual category pages
@pytest.mark.parametrize(('sort_term', 'category', 'field'), [
    ("price-low", "PS5 Games", "price"),
    ("age-low", "Xbox Games", "age_rating"),
    ("age-high", "Nintendo Switch Games", "age_rating"),
])
def test_sort_category_pages(sort_term, category, field):
    client = app.test_client()
    response = client.get(f'/sort/{sort_term}/{category}/en')
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    for i in range(0, len(data) - 1):
        assert data[i]['category'] == category
        if "low" in sort_term:
            assert data[i][field] <= data[i + 1][field]
        else:
            assert data[i][field] >= data[i + 1][field]


# tests combined filter and sort functionality
@pytest.mark.parametrize(('sort_term', 'filter_params', 'actions', 'field'), [
    # low priced, £45-60, standard delivery PS5 Games, with filter happening first
    ("price-low", [[45, 60], ["PS5 Games"], ["standard"]], ['filter', 'sort'], "price"),
    # high priced, £45-80, free delivery PS5 and Xbox Games, with sort happening first
    ("price-high", [[40, 80], ["PS5 Games", "Xbox Games"], ["free"]], ['sort', 'filter'], "price"),
    # trending products, £50-75, any delivery, Nintendo and Xbox Games, with sort happening first
    ("trending", [[50, 75], ["Nintendo Switch Games", "Xbox Games"], ["free", "standard"]],
     ['sort', 'filter'], "times_clicked"),
])
def test_filter_and_sort(sort_term, filter_params, actions, field):
    client = app.test_client()
    json_data = {
        'actions': actions,
        'filter': filter_params,
        'sort_term': sort_term,
        'lang': "en"
    }
    response = client.post(f'/filter_and_sort', json=json_data)
    assert response.status_code == 200
    data = json.loads(response.data.decode('utf-8'))
    for i in range(0, len(data) - 1):
        assert data[i]['category'] in filter_params[1]
        assert data[i]['delivery'] in filter_params[2]
        if "low" in sort_term:
            assert data[i][field] <= data[i + 1][field]
        else:
            assert data[i][field] >= data[i + 1][field]
