from Microservices.Search import Search
import pytest
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter


# valid product inventory inputs
@pytest.mark.parametrize(("category", "expected_category"), [
    ("NS", "Nintendo Switch Games"),
    ("PS5", "PS5 Games"),
    ("Xbox", "Xbox Games")
])
def test_get_product_inventory(category, expected_category):
    s = Search()
    result = s.get_product_inventory(category, "user", 'en')
    for data in result:
        assert data['category'] == expected_category


# validates any user preferences for games
@pytest.mark.parametrize(("category", "user"), [
     ("all", "jmcguckin308@gmail.com"),
     ("all", "jmonaghan@gmail.com"),
])
def test_get_product_inventory_preferences(category, user):
    s = Search()
    data = s.get_product_inventory(category, user, 'en')
    db = firestore.client()
    ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
    for doc in ref:
        user_pref = doc.to_dict()
        if 'preference' in user_pref:
            assert data[0]['category'] == user_pref['preference']
        else:
            assert data[0]['category'] != ""


@pytest.mark.parametrize(("category", "expected"), [
     ("", "Category cannot be blank"),
     ("PC", "Category entered is invalid, use PS5, NS, Xbox or all")
])
def test_product_inventory_invalid(category, expected):
    with pytest.raises(ValueError) as exception_msg:
        s = Search()
        s.get_product_inventory(category, "user", 'en')
    assert str(exception_msg.value) == expected


@pytest.mark.parametrize('expected_name', [
    'spider-man',  # lowercase item with symbol
    'ZELDA',       # all caps item
    'MaRiO',       # mixed cases
    'hogwarts',    # lowercase item
    'God of War Ragnarok',  # exact product name
    'PS5'   # category
])
def searching_for_valid_items(expected_name):
    s = Search()
    result = s.search(expected_name, 'en')
    length = len(result)
    counter = 0
    for data in result:
        assert expected_name in str.lower(data['name'])
        if expected_name in str.lower(data['name']):
            counter += 1
    assert counter == length


@pytest.mark.parametrize(('name', 'exception_expected'), [
    ('wario', False), # lowercase item that doesnt exist
    ('', True),       # blank item
    ('@', False),      # symbol
    ('56', False)      # number input
])
def test_search_invalid_items(name, exception_expected):
    s = Search()
    if exception_expected:
        with pytest.raises(ValueError) as exception_msg:
            s.search(name, 'en')
        assert str(exception_msg.value) == "Must enter a non-empty value"
    else:
        results = s.search(name, 'en')
        assert results == []


# parametrized tests for single category filtering
@pytest.mark.parametrize(('category', 'price', 'expected'), [
    (['PS5 Games'], [45, 60], "PS5 Games"),
    (["Xbox Games"], [45, 60], "Xbox Games"),
    (['Nintendo Switch Games'], [45, 60], "Nintendo Switch Games"),
])
def test_filter_one_category(price, category, expected):
    s = Search()
    result = s.filter_products(price, category, ['free'], 'en')
    for item in result:
        assert item.get('category') == expected


@pytest.mark.parametrize(('category', 'price'), [
    (['Xbox Games', 'PS5 Games'], [45, 60]),
    (["Nintendo Switch Games", "PS5 Games"], [45, 60]),
    (["Nintendo Switch Games", "Xbox Games"], [45, 60]),
    (["Xbox Games", "Nintendo Switch Games", "PS5 Games"], [45, 60]),
    (["PS5 Games", "Nintendo Switch Games", "Xbox Games"], [45, 60]),
    (["Xbox Games", "Nintendo Switch Games"], [45, 60]),
    (["PS5 Games", "Nintendo Switch Games"], [45, 60])
])
def test_filter_multiple_categories(price, category):
    s = Search()
    result = s.filter_products(price, category, ['standard'], 'en')
    for item in result:
        assert item.get('category') in category


# tests different price ranges from filter
@pytest.mark.parametrize(('categories', 'price'), [
    (['Xbox Games', 'PS5 Games', 'Nintendo Switch Games'], [40, 50]),
    (["Nintendo Switch Games", "PS5 Games", 'Xbox Games'], [30, 60]),
    (["Nintendo Switch Games", "Xbox Games", 'PS5 Games'], [50, 80]),
    (["Xbox Games", "Nintendo Switch Games", "PS5 Games"], [40, 100]),
])
def test_filter_price_ranges(price, categories):
    s = Search()
    result = s.filter_products(price, categories, ['free'], 'en')
    for item in result:
        assert price[0] <= float(item.get('price')[1:len(item.get('price'))]) <= price[1]


# different delivery options
@pytest.mark.parametrize(('categories', 'price', 'delivery'), [
    (['Xbox Games', 'PS5 Games'], [40, 50], ['free']),
    (["Nintendo Switch Games", "PS5 Games", 'Xbox Games'], [30, 60], ['standard']),
    (["Nintendo Switch Games", "Xbox Games", 'PS5 Games'], [50, 80], ['free', 'standard']),
    (["Xbox Games", "Nintendo Switch Games", "PS5 Games"], [40, 100], ['standard', 'free']),
])
def test_filter_delivery_options(price, categories, delivery):
    s = Search()
    result = s.filter_products(price, categories, delivery, 'en')
    for item in result:
        assert item.get('category') in categories
        assert item.get('delivery') in delivery


@pytest.mark.parametrize(('category', 'price', 'delivery', 'msg', 'exc_type'), [
    (['PS5'], [], ['free'], "Lists should not be empty", ValueError),
    (["PS5"], "123", ['standard'], 'Filter method should accept lists only', TypeError)
])
def test_filter_invalid(category, price, delivery, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        s = Search()
        s.filter_products(price, category, delivery, 'en')
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg


@pytest.mark.parametrize(('sort_term', 'field', "direction"), [
    ("trending", "times_clicked", "desc"),  # sort by popular items
    ("price-high", "price", "desc"),     # sort by highest-lowest price
    ("alpha", "name", "asc"),  # sort by alphabetical order
    ("price-low", "price", "asc"),  # sort by lowest-highest price
    ("age-low", "age_rating", "asc"),  # sort by lowest-highest age_rating
    ("age-high", "age_rating", "desc")  # sort by highest-lowest age_rating
])
def test_sort_all_items(sort_term, field, direction):
    s = Search()
    results = s.sort_products(sort_term, "All", 'en')
    for i in range(0, len(results) - 1):
        if direction == "asc":
            assert results[i][field] <= results[i + 1][field]
        else:
            assert results[i][field] >= results[i + 1][field]


# test for ensuring we can sort on individual category pages
@pytest.mark.parametrize(('sort_term', 'category', 'field'), [
    ("price-low", "PS5 Games", "price"),
    ("age-low", "Xbox Games", "age_rating"),
    ("age-high", "Nintendo Switch Games", "age_rating"),
])
def test_sort_category_pages(sort_term, category, field):
    s = Search()
    results = s.sort_products(sort_term, category, 'en')
    for i in range(0, len(results) - 1):
        assert results[i]['category'] == category
        if "low" in sort_term:
            assert results[i][field] <= results[i + 1][field]
        else:
            assert results[i][field] >= results[i + 1][field]


@pytest.mark.parametrize(('sort_term', 'category', 'msg', 'exc_type'), [
    ("price-mid", "PS5 Games", "You have not entered a valid value", ValueError),
    ("age-low", 123, 'This method should only accept strings', TypeError),
    ("age-low", "",  'Strings entered should not be blank', ValueError),
])
def test_sort_exception_handling(sort_term, category, msg, exc_type):
    with pytest.raises(Exception) as exception_msg:
        s = Search()
        s.sort_products(sort_term, category, 'en')
    assert isinstance(exception_msg.value, exc_type)
    assert str(exception_msg.value) == msg


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
    s = Search()
    combined_results = s.combine_filter_and_sort(actions, filter_params, sort_term, 'en')
    for i in range(0, len(combined_results) - 1):
        assert combined_results[i]['category'] in filter_params[1]
        assert combined_results[i]['delivery'] in filter_params[2]
        if "low" in sort_term:
            assert combined_results[i][field] <= combined_results[i + 1][field]
        else:
            assert combined_results[i][field] >= combined_results[i + 1][field]


@pytest.mark.parametrize('pid', [
    "h44nwXrHliy3BUupf0r5",
])
def test_update_trending(pid):
    s = Search()
    db = firestore.client()
    s.update_trending(pid)
    cart_item = db.collection('products').document(pid).get()
    new_item = cart_item.to_dict()
    assert 'times_clicked' in new_item
    assert new_item['times_clicked'] > 0
