const adminSession=API.getSession();
if(!adminSession.key||adminSession.role?.toLowerCase()!=="admin")window.location.replace("../login.html");
const adminLogout=document.getElementById("logoutButton");
if(adminLogout)adminLogout.onclick=async()=>{try{await API.logout(adminSession.role,adminSession.key)}catch{}finally{sessionStorage.clear();window.location.replace("../login.html")}};