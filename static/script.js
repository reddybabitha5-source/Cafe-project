/* =====================================
   CAFEHUB - COMPLETE JAVASCRIPT
===================================== */

var cart = [];
var total = 0;
var count = 0;


/* =====================================
   GET QUANTITY ELEMENT ID
===================================== */

function getItemId(name) {
    return "qty-" + name.toLowerCase().replaceAll(" ", "-");
}


/* =====================================
   ADD ITEM TO CART
===================================== */

function addToCart(name, price) {

    var item = cart.find(function (product) {
        return product.name === name;
    });

    if (item) {
        item.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }

    updateCart();
}


/* =====================================
   INCREASE OR DECREASE QUANTITY
===================================== */

function changeQuantity(name, price, change) {

    var item = cart.find(function (product) {
        return product.name === name;
    });

    if (!item && change < 0) {
        return;
    }

    if (!item && change > 0) {
        addToCart(name, price);
        return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(function (product) {
            return product.name !== name;
        });
    }

    updateCart();
}


/* =====================================
   UPDATE CART AND TOTAL
===================================== */

function updateCart() {

    total = 0;
    count = 0;

    var output = "";

    cart.forEach(function (item) {

        var itemTotal = item.price * item.quantity;

        total += itemTotal;
        count += item.quantity;

        output += `
            <li>
                <strong>${item.name}</strong>
                <br>
                ₹${item.price} × ${item.quantity}
                = ₹${itemTotal}
            </li>
        `;
    });


    /* CART ITEM LIST */

    var cartItems = document.getElementById("cartItems");

    if (cartItems) {

        if (cart.length === 0) {
            cartItems.innerHTML =
                "<li>Your orders will appear here.</li>";
        } else {
            cartItems.innerHTML = output;
        }
    }


    /* TOTAL ITEM COUNT */

    var countElement = document.getElementById("count");

    if (countElement) {
        countElement.textContent = count;
    }


    /* TOTAL PRICE */

    var totalElement = document.getElementById("total");

    if (totalElement) {
        totalElement.textContent = "Total: ₹" + total;
    }


    /* FLOATING CART COUNT */

    var floatingCount = document.getElementById("floatingCount");

    if (floatingCount) {
        floatingCount.textContent = count;
    }


    /* FLOATING CART TOTAL */

    var floatingTotal = document.getElementById("floatingTotal");

    if (floatingTotal) {
        floatingTotal.textContent = "₹" + total;
    }


    /* UPDATE ALL MENU QUANTITIES */

    document.querySelectorAll(".quantity-controls span").forEach(
        function (element) {
            element.textContent = "0";
        }
    );

    cart.forEach(function (item) {

        var quantityElement = document.getElementById(
            getItemId(item.name)
        );

        if (quantityElement) {
            quantityElement.textContent = item.quantity;
        }
    });

}


/* =====================================
   CLEAR ALL ORDERS
===================================== */

function clearCart() {

    if (cart.length === 0) {
        alert("Your orders are already empty!");
        return;
    }

    var confirmClear = confirm(
        "Are you sure you want to clear all orders?"
    );

    if (!confirmClear) {
        return;
    }

    cart = [];

    total = 0;
    count = 0;

    updateCart();

    var message = document.getElementById("orderMessage");

    if (message) {
        message.textContent = "All orders cleared successfully.";
    }
}


/* =====================================
   PLACE ORDER THROUGH FLASK
===================================== */

async function placeOrder() {

    /* CHECK EMPTY CART */

    if (cart.length === 0) {
        alert("Please add food items to your orders!");
        return;
    }


    /* GET CUSTOMER DETAILS */

    var name = document.getElementById("customerName").value.trim();

    var phone = document.getElementById("customerPhone").value.trim();

    var address = document.getElementById("customerAddress").value.trim();


    /* CHECK EMPTY DETAILS */

    if (name === "" || phone === "" || address === "") {

        alert("Please enter all delivery details!");

        return;
    }


    /* CHECK MOBILE NUMBER */

    if (!/^\d{10}$/.test(phone)) {

        alert("Please enter a valid 10-digit mobile number!");

        return;
    }


    /* PREPARE ORDER ITEMS */

    var orderItems = [];

    cart.forEach(function (item) {

        for (var i = 0; i < item.quantity; i++) {

            orderItems.push({
                name: item.name,
                price: item.price
            });

        }

    });


    /* ORDER DATA */

    var orderData = {

        customer_name: name,

        phone: phone,

        address: address,

        items: orderItems,

        total: total

    };


    /* SEND ORDER TO FLASK */

    try {

        var response = await fetch("/place_order", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(orderData)

        });


        var result = await response.json();


        if (response.ok) {

            alert(
                result.message || "Your order has been placed successfully!"
            );


            /* CLEAR CART AFTER SUCCESS */

            cart = [];

            total = 0;

            count = 0;

            updateCart();


            /* CLEAR CUSTOMER DETAILS */

            document.getElementById("customerName").value = "";

            document.getElementById("customerPhone").value = "";

            document.getElementById("customerAddress").value = "";


            var message = document.getElementById("orderMessage");

            if (message) {
                message.textContent = "Your order has been placed successfully!";
            }

        } else {

            alert(result.message || "Unable to place your order!");

        }

    } catch (error) {

        console.error("Order Error:", error);

        alert("Unable to connect to Flask. Please check your server!");

    }

}


/* =====================================
   INITIALIZE CART
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    updateCart();

});