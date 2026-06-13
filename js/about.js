/* ==========================
   ABOUT PAGE
========================== */

const whyCards =
document.querySelectorAll(".why-card");

whyCards.forEach(card => {

card.addEventListener("mouseenter", () => {

card.style.transform =
"translateY(-10px)";

});

card.addEventListener("mouseleave", () => {

card.style.transform =
"translateY(0)";

});

});

console.log(
"About Page Loaded 🚀"
);