const $=id=>document.getElementById(id);
const session=API.getSession();
if(!session.key||session.role?.toLowerCase()!=="customer")window.location.replace("login.html");
const historyId=sessionStorage.getItem("selectedOrderHistoryId");
if(!historyId)window.location.replace("order-history.html");

function money(v){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(Number(v)||0)}
function date(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString("en-IN")}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
$("logoutButton").onclick=async()=>{try{await API.logout(session.role,session.key)}catch{}finally{sessionStorage.clear();window.location.replace("login.html")}};

(async()=>{
 try{
  const entry=await API.getOrderHistoryById(historyId),bill=entry?.bill||{},order=bill.order||{},items=order.foodCart?.itemList||[];
  $("detailStatus").textContent=order.orderStatus||"Placed";
  $("detailOrderDate").textContent=date(order.orderDate);
  $("detailBillDate").textContent=date(bill.billDate);
  $("detailCount").textContent=bill.totalItem??items.reduce((n,i)=>n+(Number(i.quantity)||1),0);
  $("detailTotal").textContent=money(bill.totalCost);
  items.forEach(item=>{
   const q=Math.max(1,Number(item.quantity)||1),cost=Number(item.cost)||0,row=document.createElement("div");
   row.className="checkout-item";
   row.innerHTML=`<div><strong>${esc(item.itemName||"Food")}</strong><span>${esc(item.category?.categoryName||"Food")}</span></div><div><span>${q} × ${money(cost)}</span><strong>${money(q*cost)}</strong></div>`;
   $("detailItems").appendChild(row);
  });
  $("detailsLayout").classList.remove("hidden");
 }catch(e){$("detailsMessage").textContent=e.message||"Unable to load order details.";$("detailsMessage").className="message error"}
 finally{$("detailsLoading").classList.add("hidden")}
})();