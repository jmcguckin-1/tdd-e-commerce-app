from flask import Flask, request, send_from_directory, jsonify, redirect
from Microservices.Search import Search
from Microservices.Cart import Cart
from Microservices.Profile import Profile

app = Flask(__name__)

s = Search()


#  Search endpoints
@app.route('/get_product_inventory/<category>/<user>/<lang>')
def get_inventory(category, user, lang):
    data = s.get_product_inventory(category, user, lang)
    return data


@app.route('/search/<name>/<lang>', methods=['GET'])
def search(name, lang):
    data = s.search(name, lang)
    return data


@app.route('/filter', methods=['POST'])
def filter_products():
    json = request.get_json()
    category = json.get('category')
    price = json.get('price')
    delivery = json.get('delivery')
    lang = json.get('lang')
    data = s.filter_products(price, category, delivery, lang)
    return data


@app.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory('images', filename)


@app.route('/sort/<sort_term>/<category>/<lang>', methods=['GET'])
def sort_products(sort_term, category, lang):
    data = s.sort_products(sort_term, category, lang)
    return data


@app.route("/update_trending", methods=['POST'])
def update_trending():
    data = request.get_json()
    pid = data.get('id')
    s.update_trending(pid)
    return ""


@app.route("/filter_and_sort", methods=['POST'])
def filter_and_sort():
    data = request.get_json()
    actions = data.get('actions')
    filter_params = data.get('filter')
    sort_term = data.get('sort_term')
    lang = data.get('lang')
    data = s.combine_filter_and_sort(actions, filter_params, sort_term, lang)
    return data


# cart endpoints

@app.route('/update_cart', methods=['POST'])
def update_cart():
    data = request.get_json()
    cart_list = data.get('cart')
    user = data.get('user')
    c = Cart()
    for cart_item in cart_list:
        c.update_cart(cart_item, user)
    return ""


@app.route('/get_cart_contents', methods=['GET'])
def get_cart():
    email = request.args.get('user')
    lang = request.args.get('lang')
    c = Cart()
    return c.get_cart(email, lang)


@app.route('/get_cart_presence', methods=['GET'])
def get_cart_presence():
    email = request.args.get('user')
    c = Cart()
    data = c.get_presence(email)
    return data


@app.route("/get_cart_total", methods=['GET'])
def get_cart_total():
    email = request.args.get('user')
    lang = request.args.get('lang')
    c = Cart()
    data = c.get_cart_total(email, lang)
    return data


@app.route("/update_cart_menu", methods=['POST'])
def update_cart_menu():
    params = request.get_json()
    user = params.get('user')
    new_cart = params.get('cart')
    c = Cart()
    c.update_cart_menu(new_cart, user)
    return ""


@app.route("/out_of_stock", methods=['GET'])
def product_out_of_stock():
    pid = request.args.get('product')
    c = Cart()
    data = c.out_of_stock(pid)
    return data


@app.route('/process_paypal', methods=['POST', 'GET'])
def process_paypal():
    params = request.get_json()
    amount = params.get('amount')
    currency = params.get('currency')
    method = params.get('method')
    c = Cart()
    data = c.process_paypal_payment(amount, currency, method)
    return data


@app.route('/make_payment', methods=['GET'])
def make_payment():
    c = Cart()
    pay_id = request.args.get('paymentId')
    payer_id = request.args.get('PayerID')
    data = c.make_payment(payer_id, pay_id)
    if data:
        return redirect('http://localhost:3000/orderconf')


@app.route("/place_order", methods=['POST'])
def place_order():
    params = request.get_json()
    c = Cart()
    user = params.get('user')
    cart = params.get('final_cart')
    lang = params.get('lang')
    c.place_order(user, cart, lang)
    return ""


@app.route('/get_details', methods=['GET'])
def get_user_details():
    user = request.args.get('user')
    p = Profile()
    data = p.get_user_details(user)
    return data


@app.route("/send_password_reset", methods=['POST'])
def send_password_reset():
    params = request.get_json()
    p = Profile()
    user = params.get('user')
    lang = params.get('lang')
    p.send_password_reset(user, lang)
    return ""


@app.route("/validate_user", methods=['POST'])
def validate_user():
    params = request.get_json()
    p = Profile()
    user = params.get('user')
    input = params.get('input')
    results = p.validate_user(user, input)
    return results


@app.route('/get_order_history', methods=['GET'])
def get_order_history():
    user = request.args.get('user')
    lang = request.args.get('lang')
    p = Profile()
    data = p.get_order_history(user, lang)
    return data


@app.route('/change_details', methods=['POST'])
def change_details():
    params = request.get_json()
    user = params.get('user')
    details_list = params.get('details')
    p = Profile()
    p.change_details(user, details_list)
    return ""


@app.route('/validate_code', methods=['POST'])
def validate_discount_code():
    params = request.get_json()
    user = params.get('user')
    code = params.get('code')
    p = Profile()
    data = p.validate_code(user, code)
    return data


@app.route('/apply_discount_code', methods=['POST'])
def apply_discount_code():
    params = request.get_json()
    user = params.get('user')
    price = params.get('price')
    lang = params.get('lang')
    p = Profile()
    data = p.apply_discount_code(user, price, lang)
    return data


if __name__ == '__main__':
    app.run()