
var total = 0;
var count = 0;

function addToCart(name, price) {

    document.getElementById("cartItems").innerHTML +=
    "<li>" + name + " - ₹" + price + "</li>";

    total = total + price;
    count++;

    document.getElementById("count").innerHTML = count;
    document.getElementById("total").innerHTML = "Total: ₹" + total;
}

function placeOrder() {

    alert("Order placed successfully!");
}

function clearCart() {

    document.getElementById("cartItems").innerHTML = "";

    total = 0;
    count = 0;

    document.getElementById("count").innerHTML = count;
    document.getElementById("total").innerHTML = "Total: ₹0";
}
