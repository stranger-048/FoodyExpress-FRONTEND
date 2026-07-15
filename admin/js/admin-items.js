const $=id=>document.getElementById(id);let items=[],categories=[],editing=null,timer;
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function toast(t,type="success"){clearTimeout(timer);$("adminToast").textContent=t;$("adminToast").className=`toast ${type}`;timer=setTimeout(()=>$("adminToast").classList.add("hidden"),2500)}
function render(){const q=$("itemSearch").value.trim().toLowerCase();$("itemRows").innerHTML="";items.filter(i=>(i.itemName||"").toLowerCase().includes(q)||(i.category?.categoryName||"").toLowerCase().includes(q)).forEach(i=>{const tr=document.createElement("tr");tr.innerHTML=`<td><strong>${esc(i.itemName)}</strong></td><td>${esc(i.category?.categoryName||"—")}</td><td>₹${Number(i.cost||0).toFixed(2)}</td><td>${esc(i.quantity)}</td><td><div class="table-actions"><button class="edit-button">Edit</button><button class="delete-button">Delete</button></div></td>`;tr.querySelector(".edit-button").onclick=()=>open(i);tr.querySelector(".delete-button").onclick=()=>remove(i);$("itemRows").appendChild(tr)})}
function options() {
  if (!categories.length) {
    return `
            <option value="">
                No categories available
            </option>
        `;
  }

  return (
    `
        <option value="">
            Select a category
        </option>
    ` +
    categories
      .map((category) => {
        return `
            <option value="${category.categoryId}">
                ${esc(category.categoryName)}
            </option>
        `;
      })
      .join("")
  );
}
function open(i=null){editing=i;$("itemModalTitle").textContent=i?"Edit Food Item":"Add Food Item";$("itemForm").reset();$("itemCategory").innerHTML=options();if(i){$("itemName").value=i.itemName||"";$("itemCost").value=i.cost??"";$("itemQuantity").value=i.quantity??"";$("itemCategory").value=i.category?.categoryId??""}$("itemModal").classList.remove("hidden")}
function close(){$("itemModal").classList.add("hidden");editing=null}
function payload() {
  const categoryId = Number($("itemCategory").value);

  const selectedCategory = categories.find(
    (category) => Number(category.categoryId) === categoryId,
  );

  if (!selectedCategory) {
    throw new Error("Please select a valid category.");
  }

  if (editing) {
    return {
      itemId: editing.itemId,
      catergoryId: selectedCategory.categoryId,
      itemName: $("itemName").value.trim(),
      cost: Number($("itemCost").value),
      quantity: Number(editing.quantity ?? 0),
    };
  }

  return {
    itemName: $("itemName").value.trim(),
    catergoryName: selectedCategory.categoryName,
    cost: Number($("itemCost").value),
  };
}
async function load() {
  // LOAD CATEGORIES SEPARATELY
  try {
    const categoryResponse = await API.getAllCategories();

    console.log("CATEGORY RESPONSE:", categoryResponse);

    categories = Array.isArray(categoryResponse) ? categoryResponse : [];
  } catch (error) {
    console.error("CATEGORY LOAD ERROR:", error);

    categories = [];

    toast("Unable to load categories: " + error.message, "error");
  }

  // LOAD ITEMS SEPARATELY
  try {
    const itemResponse = await API.getAllItems();

    console.log("ITEM RESPONSE:", itemResponse);

    items = Array.isArray(itemResponse) ? itemResponse : [];
  } catch (error) {
    console.error("ITEM LOAD ERROR:", error);

    items = [];

    console.warn(
      "Food items could not be loaded, " +
        "but category dropdown will still work.",
    );
  }

  render();

  $("itemTableWrap").classList.remove("hidden");

  $("itemLoading").classList.add("hidden");
}
async function remove(i){if(!confirm(`Delete ${i.itemName}?`))return;try{await API.deleteItem({catergoryId:i.category?.categoryId,cost:i.cost,itemId:i.itemId,itemName:i.itemName,quantity:i.quantity});items=items.filter(x=>x.itemId!==i.itemId);render();toast("Food item deleted.")}catch(e){toast(e.message||"Unable to delete food item.","error")}}
$("addItemButton").onclick=()=>open();$("closeItemModal").onclick=close;$("itemModal").onclick=e=>{if(e.target===$("itemModal"))close()};$("itemSearch").oninput=render;
$("itemForm").onsubmit=async e=>{e.preventDefault();const b=$("saveItemButton");try{b.disabled=true;b.textContent="Saving...";const result=editing?await API.updateItem(payload()):await API.addItem(payload());if(editing)items=items.map(i=>i.itemId===editing.itemId?result:i);else items.push(result);close();render();toast("Food item saved.")}catch(err){toast(err.message||"Unable to save food item.","error")}finally{b.disabled=false;b.textContent="Save Food Item"}};
load();