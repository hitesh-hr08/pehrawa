/* ==========================
   CONTACT WHATSAPP FORM
========================== */

const contactForm =
document.getElementById("contactForm");

if(contactForm){

contactForm.addEventListener("submit",function(e){

e.preventDefault();

const name =
document.getElementById("contactName").value;

const phone =
document.getElementById("contactPhone").value;

const email =
document.getElementById("contactEmail").value;

const message =
document.getElementById("contactMessage").value;

const whatsappMessage =

`📩 CONTACT REQUEST

👤 Name: ${name}

📞 Phone: ${phone}

📧 Email: ${email}

📝 Message:
${message}`;

window.open(
`https://wa.me/919855707708?text=${encodeURIComponent(whatsappMessage)}`,
"_blank"
);

});

}