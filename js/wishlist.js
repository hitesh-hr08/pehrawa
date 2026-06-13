let wishlist =
JSON.parse(localStorage.getItem("wishlist")) || [];

let cart =
JSON.parse(localStorage.getItem("cart")) || [];

const wishlistContainer =
document.getElementById("wishlistItems");

function renderWishlist(){

if(wishlist.length === 0){

wishlistContainer.innerHTML =

`<div class="empty-wishlist">
Your wishlist is empty ❤️
</div>`;

return;
}

wishlistContainer.innerHTML = "";

wishlist.forEach((product,index)=>{

wishlistContainer.innerHTML +=

`
<div class="wishlist-item">

<div>
<h3>${product.name}</h3>
<p>₹${product.price}</p>
</div>

<div class="wishlist-actions">

<button
class="move-btn"
onclick="moveToCart(${index})">

Move To Cart

</button>

<button
class="remove-btn"
onclick="removeWishlist(${index})">

Remove

</button>

</div>

</div>
`;

});

}

function moveToCart(index){

cart.push(wishlist[index]);

localStorage.setItem(
"cart",
JSON.stringify(cart)
);

wishlist.splice(index,1);

localStorage.setItem(
"wishlist",
JSON.stringify(wishlist)
);

renderWishlist();

alert("Product moved to cart");

}

function removeWishlist(index){

wishlist.splice(index,1);

localStorage.setItem(
"wishlist",
JSON.stringify(wishlist)
);

renderWishlist();

}

renderWishlist();