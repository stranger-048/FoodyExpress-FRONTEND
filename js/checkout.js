const $ = id => document.getElementById(id);
const session = API.getSession();
if (!session.key || !session.userId || session.role?.toLowerCase() !== "customer") {
  window.location.replace("login.html");
}

function money(v) {
  return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(Number(v)||0);
}
function getCart() {
  try { return JSON.parse(sessionStorage.getItem("currentCart") || "null"); }
  catch { return null; }
}
const cart=getCart();
const items=Array.isArray(cart?.itemList)?cart.itemList:[];

if (!items.length) {
  $("checkoutMessage").textContent="Your cart is empty. Add food before checkout.";
  $("checkoutMessage").className="message error";
} else {
  $("checkoutLayout").classList.remove("hidden");
  let total=0,count=0;
  items.forEach(item=>{
    const q=Math.max(1,Number(item.quantity)||1), cost=Number(item.cost)||0;
    total+=q*cost; count+=q;
    const row=document.createElement("div");
    row.className="checkout-item";
    row.innerHTML=`<div><strong>${String(item.itemName||"Food")}</strong><span>${String(item.category?.categoryName||"Food")}</span></div><div><span>${q} × ${money(cost)}</span><strong>${money(q*cost)}</strong></div>`;
    $("checkoutItems").appendChild(row);
  });
  $("checkoutCount").textContent=count;
  $("checkoutTotal").textContent=money(total);
}

$("logoutButton").onclick=async()=>{
  try { await API.logout(session.role,session.key); } catch {}
  sessionStorage.clear(); window.location.replace("login.html");
};

$("placeOrderButton").onclick=async()=>{
  const button=$("placeOrderButton");
  try {
    button.disabled=true; button.textContent="Placing order...";
    const order=await API.placeOrder();
    if (!order?.orderId) throw new Error("Backend created no usable order ID.");
    sessionStorage.setItem("lastOrder",JSON.stringify(order));

    button.textContent="Generating bill...";
    const bill=await API.generateBill(order.orderId);
    sessionStorage.setItem("lastBill",JSON.stringify(bill));

    sessionStorage.removeItem("currentCart");
    sessionStorage.setItem("cartItemCount","0");
    window.location.href="order-confirmation.html";
  } catch(error) {
    $("checkoutMessage").textContent=error.message||"Unable to place order.";
    $("checkoutMessage").className="message error";
    button.disabled=false; button.textContent="Place Order";
  }
};