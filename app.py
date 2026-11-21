from flask import (
    Flask, render_template, request,
    jsonify, redirect, url_for, session
)
import json
import os
from pathlib import Path
from datetime import datetime
from functools import wraps

app = Flask(__name__)

# LOGIN SETTINGS
# Change these demo credentials before using publicly.

app.secret_key = os.environ.get(
    "SECRET_KEY", "change-this-development-secret"
)

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "CafeHub@123")

ORDERS_FILE = Path(__file__).parent / "orders.json"


# CHECK ADMIN LOGIN

def admin_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))

        return function(*args, **kwargs)

    return wrapper


def read_orders():

    if not ORDERS_FILE.exists():
        return []

    try:
        with open(ORDERS_FILE, "r") as file:
            orders = json.load(file)

        return orders if isinstance(orders, list) else []

    except (OSError, json.JSONDecodeError):
        return None


def save_orders(orders):

    with open(ORDERS_FILE, "w") as file:
        json.dump(orders, file, indent=4)


# CUSTOMER WEBSITE

@app.route('/')
def home():
    return render_template('index.html')


# PLACE CUSTOMER ORDER

@app.route('/place_order', methods=['POST'])
def place_order():

    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid order!"}), 400

    name = data.get('customer_name', '').strip()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()
    items = data.get('items', [])

    if not name or not phone or not address:
        return jsonify({
            "message": "Please enter all customer details!"
        }), 400

    if not phone.isdigit() or len(phone) != 10:
        return jsonify({
            "message": "Enter a valid 10-digit phone number!"
        }), 400

    if not isinstance(items, list) or not items:
        return jsonify({
            "message": "Your cart is empty!"
        }), 400

    try:
        clean_items = []

        for item in items:

            item_name = item.get('name', '').strip()
            price = float(item.get('price', 0))

            if not item_name or price <= 0:
                raise ValueError("Invalid item")

            clean_items.append({
                "name": item_name,
                "price": price
            })

        total = sum(item['price'] for item in clean_items)

    except (AttributeError, TypeError, ValueError):
        return jsonify({
            "message": "Invalid food items!"
        }), 400

    order = {
        "customer_name": name,
        "phone": phone,
        "address": address,
        "items": clean_items,
        "total": total,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "Pending"
    }

    orders = read_orders()

    if orders is None:
        return jsonify({
            "message": "Unable to read orders file!"
        }), 500

    orders.append(order)

    try:
        save_orders(orders)

    except OSError:
        return jsonify({
            "message": "Unable to save order!"
        }), 500

    return jsonify({
        "success": True,
        "message": "Order placed successfully!"
    })


# ADMIN LOGIN PAGE

@app.route('/admin-login', methods=['GET', 'POST'])
def admin_login():

    if session.get("admin_logged_in"):
        return redirect(url_for("admin"))

    error = None

    if request.method == 'POST':

        username = request.form.get('username', '')
        password = request.form.get('password', '')

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:

            session.clear()
            session["admin_logged_in"] = True

            return redirect(url_for("admin"))

        error = "Incorrect username or password!"

    return render_template('login.html', error=error)


# ADMIN LOGOUT

@app.route('/admin-logout')
def admin_logout():

    session.clear()

    return redirect(url_for("admin_login"))


# ADMIN DASHBOARD

@app.route('/admin')
@admin_required
def admin():

    return render_template('admin.html')


# DISPLAY CUSTOMER ORDERS

@app.route('/admin/orders')
@admin_required
def get_orders():

    orders = read_orders()

    if orders is None:
        return jsonify({
            "message": "Unable to read orders!"
        }), 500

    return jsonify(orders)


# UPDATE ORDER STATUS

@app.route('/update_status', methods=['POST'])
@admin_required
def update_status():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request!"
        }), 400

    index = data.get('index')
    status = data.get('status')

    if status not in ['Pending', 'Preparing', 'Delivered']:
        return jsonify({
            "success": False,
            "message": "Invalid status!"
        }), 400

    orders = read_orders()

    if orders is None:
        return jsonify({
            "success": False,
            "message": "Unable to read orders!"
        }), 500

    if not isinstance(index, int) or index < 0 or index >= len(orders):
        return jsonify({
            "success": False,
            "message": "Order not found!"
        }), 404

    orders[index]['status'] = status

    try:
        save_orders(orders)

    except OSError:
        return jsonify({
            "success": False,
            "message": "Unable to update order!"
        }), 500

    return jsonify({
        "success": True,
        "message": "Status updated successfully!"
    })


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )