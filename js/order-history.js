const $=id=>document.getElementById(id);
const session=API.getSession();
if(!session.key||!session.userId||session.role?.toLowerCase()!=="customer")window.location.replace("login.html");

function money(v){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(Number(v)||0)}
function date(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString("en-IN")}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

$("navToggle").onclick=()=>$("navLinks").classList.toggle("open");
$("logoutButton").onclick=async()=>{try{await API.logout(session.role,session.key)}catch{}finally{sessionStorage.clear();window.location.replace("login.html")}};

(async()=>{
 try{
  const history=await API.getCustomerOrderHistory();
  if(!Array.isArray(history))throw new Error("Order history API did not return a list.");
  $("historyEmpty").classList.toggle("hidden",history.length!==0);
  history.sort((a,b)=>new Date(b.bill?.order?.orderDate||0)-new Date(a.bill?.order?.orderDate||0));
  history.forEach(entry=>{
   const bill=entry.bill||{},order=bill.order||{},items=order.foodCart?.itemList||[];
   const card=document.createElement("article");card.className="order-history-card";
   card.innerHTML=`
    <div class="order-history-head"><div><span class="order-status">${esc(order.orderStatus||"Placed")}</span><h2>${date(order.orderDate)}</h2></div><strong class="order-total">${money(bill.totalCost)}</strong></div>
    <div class="order-preview">${items.slice(0,3).map(i=>`<span>${esc(i.itemName||"Food")} × ${Math.max(1,Number(i.quantity)||1)}</span>`).join("")}${items.length>3?`<span>+ ${items.length-3} more</span>`:""}</div>
    <div class="order-history-foot"><span>${bill.totalItem??items.length} item(s)</span><button class="btn view-order-button" type="button">View Details</button></div>`;
   card.querySelector(".view-order-button").onclick=()=>{
    sessionStorage.setItem("selectedOrderHistoryId",String(entry.orderHistoryId));
    window.location.href="order-details.html";
   };
   $("historyContainer").appendChild(card);
  });
 }catch(e){$("historyMessage").textContent=e.message||"Unable to load order history.";$("historyMessage").className="message error"}
 finally{$("historyLoading").classList.add("hidden")}
})();