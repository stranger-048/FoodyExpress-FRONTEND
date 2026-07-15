const $=id=>document.getElementById(id);
const session=API.getSession();
if (!session.key || session.role?.toLowerCase()!=="customer") window.location.replace("login.html");

function read(name){try{return JSON.parse(sessionStorage.getItem(name)||"null")}catch{return null}}
function money(v){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(Number(v)||0)}
const order=read("lastOrder"), bill=read("lastBill");
if (!order && !bill) window.location.replace("restaurants.html");

$("orderStatus").textContent=order?.orderStatus||"Placed";
if (bill) {
  $("billTotal").textContent=money(bill.totalCost);
  $("billItems").textContent=bill.totalItem ?? "—";
  $("billDate").textContent=bill.billDate ? new Date(bill.billDate).toLocaleString("en-IN") : "—";
}
if (order?.orderDate) $("confirmationText").textContent=`Order placed on ${new Date(order.orderDate).toLocaleString("en-IN")}.`;