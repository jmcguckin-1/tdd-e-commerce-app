import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter
from collections import defaultdict

cred_obj = credentials.Certificate(
            'tdd-ecommerceapplication-firebase-adminsdk-vfvrw-e878767af1.json')
firebase_admin.initialize_app(cred_obj)


class Search:

    def __init__(self):
       pass

    def get_product_inventory(self, category, user, lang):
        if category == '':
            raise ValueError("Category cannot be blank")

        preference_products = []
        other_products = []
        preferences = False

        global refs
        db = firestore.client()
        # gets all the products
        if category == "all":
            # https://firebase.google.com/docs/firestore/query-data/queries#simple_queries
            refs = db.collection('products').where(filter=FieldFilter("name", "!=", "")).get()
        elif category == "PS5":
            refs = db.collection('products').where(filter=FieldFilter("category", "==", "PS5 Games")).get()
        elif category == "NS":
            refs = db.collection('products').where(filter=FieldFilter("category", "==", "Nintendo Switch Games")).get()
        elif category == "Xbox":
            refs = db.collection('products').where(filter=FieldFilter("category", "==", "Xbox Games")).get()
        else:
            raise ValueError("Category entered is invalid, use PS5, NS, Xbox or all")
        data = []
        for ref in refs:
            product = ref.to_dict()
            product['id'] = ref.id
            product['description'].replace('\\n', '\n')
            self.update_load_lang(lang, product)
            if category == "all":
                ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
                # handles user preferences based on profile settings
                if ref:
                    for doc in ref:
                        user_info = doc.to_dict()
                        if 'preference' in user_info:
                            preferences = True
                            if product['category'] == user_info['preference']:
                                preference_products.append(product)
                            else:
                                other_products.append(product)
                        else:
                            data.append(product)
            else:
                data.append(product)

        if preferences:
            data = preference_products + other_products
        return data

    def search(self, item, lang):
        # searches the database for user input
        db = firestore.client()
        if item != "":
            # https://firebase.google.com/docs/firestore/query-data/queries#simple_queries
            refs1 = db.collection('products').where(filter=FieldFilter("name", "!=", "")).get()
            data = []
            for ref in refs1:
                if (str.lower(item) in str.lower(ref.to_dict()['name']) or
                        str.lower(item) in str.lower(ref.to_dict()['category'])):
                    product = ref.to_dict()
                    product['id'] = ref.id
                    self.update_load_lang(lang, product)
                    data.append(product)
            return data
        else:
            raise ValueError("Must enter a non-empty value")

    def price_filter(self, max_p, min_p, db):
        price_res = []
        # https://firebase.google.com/docs/firestore/query-data/queries#simple_queries
        products = db.collection('products').where(filter=FieldFilter("name", "!=", "")).get()
        for prod in products:
            product = prod.to_dict()
            product['id'] = prod.id
            price = product.get('price')
            if price is not None:
                value = float(price[1:len(price)])
                if min_p <= value <= max_p:
                    price_res.append(product)
        return price_res

    def category_filter(self, db, category):
        category_res = []
        for choice in category:
            # https://firebase.google.com/docs/firestore/query-data/queries#simple_queries
            products = db.collection('products').where(filter=FieldFilter("category", "==", choice)).get()
            for product in products:
                prod_dict = product.to_dict()
                prod_dict['id'] = product.id
                category_res.append(prod_dict)
        return category_res

    def delivery_filter(self, db, deliv):
        delivery_res = []
        for choice in deliv:
            # https://firebase.google.com/docs/firestore/query-data/queries#simple_queries
            products = db.collection('products').where(filter=FieldFilter("delivery", "==", choice)).get()
            for product in products:
                prod_dict = product.to_dict()
                prod_dict['id'] = product.id
                delivery_res.append(prod_dict)
        return delivery_res

    def filter_products(self, price, category, delivery, lang):
        # will filter products based on user input
        if type(price) is not list or type(category) is not list or type(delivery) is not list:
            raise TypeError("Filter method should accept lists only")

        if len(price) == 0:
            raise ValueError("Lists should not be empty")

        db = firestore.client()

        # price ranges
        min_price = price[0]
        max_price = price[1]

        # calls individual filter methods
        prices = self.price_filter(max_price, min_price, db)
        categories = self.category_filter(db, category)
        deliveries = self.delivery_filter(db, delivery)

        # ensures uniqueness in dictionaries
        unique_prices_dict = {item['id']: item for item in prices}
        unique_categories_dict = {item['id']: item for item in categories}

        if len(delivery) > 0:
            unique_deliv_dict = {item['id']: item for item in deliveries}
        else:
            unique_deliv_dict = {}

        # Got the idea from ChatGPT to combine the three separate results,
        # but edited the code it provided as it provided incorrect data based on my own work
        combined_results_dict = {**unique_prices_dict, **unique_categories_dict, **unique_deliv_dict}

        combined_results = list(combined_results_dict.values())

        # if just price is selected as a filter
        if not category and not delivery:
            for p in combined_results:
                self.update_load_lang(lang, p)
            return combined_results

        filtered_right_data = [
            filtered_item for filtered_item in combined_results if
            (not category or filtered_item.get('category') in category) and
            min_price <= float(filtered_item.get('price')[1:len(filtered_item.get('price'))]) <= max_price and
            (not delivery or filtered_item.get('delivery') in delivery)
        ]
        for item in filtered_right_data:
            self.update_load_lang(lang, item)

        return filtered_right_data

    def sort_products(self, term, category, lang):
        if type(term) is not str or type(category) is not str:
            raise TypeError("This method should only accept strings")

        if term == "" or category == "":
            raise ValueError("Strings entered should not be blank")

        db = firestore.client()
        data = []
        category_data = []
        field = ""
        order = firestore.Query.ASCENDING

        # different sort category handling
        if term == "price-low":
            field = "price"
            order = firestore.Query.ASCENDING
        elif term == "price-high":
            order = firestore.Query.DESCENDING
            field = "price"
        elif term == "age-low":
            order = firestore.Query.ASCENDING
            field = "age_rating"
        elif term == "age-high":
            field = "age_rating"
            order = firestore.Query.DESCENDING
        elif term == "alpha":
            field = "name"
            order = firestore.Query.ASCENDING
        elif term == "trending":
            field = "times_clicked"
            order = firestore.Query.DESCENDING
        else:
            raise ValueError("You have not entered a valid value")

        sort_refs = db.collection('products').order_by(field, direction=order).get()
        for ref in sort_refs:
            product = ref.to_dict()
            # for category page display
            if product['category'] == category:
                self.update_load_lang(lang, product)
                category_data.append(product)
            product['id'] = ref.id
            product['description'].replace('\\n', '\n')
            self.update_load_lang(lang, product)
            # for regular page display
            data.append(product)

        if category == "All":
            return data
        return category_data


    def combine_filter_and_sort(self, actions, filter_params, sort_term, lang):
        if type(actions) is not list or type(filter_params) is not list or type(sort_term) is not str:
            raise ValueError("Wrong type entered for actions, filter_params or sort term")

        item_1 = actions[0]
        price = filter_params[0]
        category = filter_params[1]
        delivery = filter_params[2]
        filtered_and_sorted = []
        # if filter happens first
        if item_1 == "filter":
            # Got the idea for this functionality from ChatGPT
            # Where I asked how to ensure filtered and sorted products could be combined.
            # I edited the code it gave me to add on language constraints and ensure the correct data was returned
            filtered_items = self.filter_products(price, category, delivery, lang)
            filtered_and_sorted.extend(filtered_items)
            sorted_items = self.sort_products(sort_term, "All", lang)
            filtered_and_sorted = [product for product in sorted_items if product in filtered_and_sorted]
        # if sort happens first
        else:
            sorted_items = self.sort_products(sort_term, "All", lang)
            filtered_items = self.filter_products(price, category, delivery, lang)
            filtered_and_sorted = [product for product in sorted_items if product in filtered_items]
        return filtered_and_sorted

    # updates trending products in the database
    def update_trending(self, pid):
        if pid == "":
            raise ValueError("Product id should not be blank!")
        db = firestore.client()
        cart_item = db.collection('products').document(pid).get()
        doc_ref = db.collection('products').document(pid)
        product = cart_item.to_dict()
        times_clicked = 1
        product['times_clicked'] += times_clicked
        doc_ref.update({"times_clicked": product['times_clicked']})

    # updates filter categories and delivery for display in React
    def update_load_lang(self, lang, product):
        if lang == 'fr':
            product['price'] = "€" + product['price'][1:]
            if "PS5" in product['category']:
                product['category'] = "Jeux PS5"
            elif "Xbox" in product['category']:
                product['category'] = "Jeux Xbox"
            else:
                product['category'] = "Jeux Nintendo Switch"
            if product['delivery'] == 'free':
                product['delivery'] = 'Gratuit'
