/* ========= 1. CONFIGURATION ========= */
const CONTRACT_ADDRESS = "0x2341F58D8998Ff926aB532646c8E80bc7e537380"; 
const ADMIN_PASSKEY = "admin123"; // Your local access key
const ABI =[
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "projectId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "submitter",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "ProjectSubmitted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "projectId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "enum ProjectTimestamping.Status",
				"name": "newStatus",
				"type": "uint8"
			}
		],
		"name": "StatusUpdated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_projectHash",
				"type": "string"
			}
		],
		"name": "submitProject",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_projectId",
				"type": "uint256"
			},
			{
				"internalType": "enum ProjectTimestamping.Status",
				"name": "_newStatus",
				"type": "uint8"
			}
		],
		"name": "updateProjectStatus",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_projectId",
				"type": "uint256"
			}
		],
		"name": "getProject",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "projectHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "submitter",
						"type": "address"
					},
					{
						"internalType": "enum ProjectTimestamping.Status",
						"name": "status",
						"type": "uint8"
					}
				],
				"internalType": "struct ProjectTimestamping.Project",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "projectCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "projects",
		"outputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "projectHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "submitter",
				"type": "address"
			},
			{
				"internalType": "enum ProjectTimestamping.Status",
				"name": "status",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "usedHashes",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let provider, signer, contract, userAddress;
let allProjects = [];

/* ========= 2. WALLET CONNECTION ========= */
async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found!");
    try {
        const connectBtn = document.getElementById("connectWallet");
        connectBtn.innerText = "Connecting...";
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        document.getElementById("walletAddress").innerText = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
        connectBtn.innerText = "Connected";
        connectBtn.disabled = true;

        await syncData();
        await checkAdminStatus();
    } catch (err) {
        console.error("Connection failed:", err);
        document.getElementById("connectWallet").innerText = "Connect Wallet";
    }
}

/* ========= 3. ADMIN LOGIN & LOCK LOGIC ========= */
window.toggleAdminLogin = function() {
    document.getElementById('adminLoginModal').classList.toggle('hidden');
    document.getElementById('adminPasskey').value = "";
};

document.getElementById('loginSubmitBtn').onclick = function() {
    const enteredPasskey = document.getElementById('adminPasskey').value;
    if (enteredPasskey === ADMIN_PASSKEY) {
        document.getElementById('adminLoginModal').classList.add('hidden');
        const adminPanel = document.getElementById('adminPanel');
        adminPanel.classList.remove('hidden');
        adminPanel.scrollIntoView({ behavior: 'smooth' });
        performSearch(); 
    } else {
        alert("Incorrect Passkey. Access Denied.");
    }
};

window.logoutAdmin = function() {
    document.getElementById('adminPanel').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function checkAdminStatus() {
    try {
        const adminAddr = await contract.admin();
        // Shows the lock icon/login button only if the wallet matches the contract admin
        const lockTrigger = document.getElementById("adminLockBtn");
        if (userAddress.toLowerCase() === adminAddr.toLowerCase()) {
            lockTrigger.classList.remove("hidden");
        }
    } catch (err) { console.log("Owner check failed."); }
}

/* ========= 4. DATA SYNC & SEARCH ========= */
async function syncData() {
    try {
        const countBN = await contract.projectCount();
        const count = countBN.toNumber();
        allProjects = [];
        for (let i = 1; i <= count; i++) {
            const p = await contract.getProject(i);
            allProjects.push({ 
                id: i, 
                title: p.title, 
                status: p.status, 
                timestamp: new Date(p.timestamp.toNumber() * 1000).toLocaleString() 
            });
        }
    } catch (err) { console.error("Sync error:", err); }
}

function performSearch() {
    const query = document.getElementById("dashboardSearch").value.trim().toLowerCase(); 
    const studentTbody = document.getElementById("projectsTableBody");
    const adminTbody = document.getElementById("adminTableBody");
    const isAdminVisible = !document.getElementById("adminPanel").classList.contains("hidden");

    if (!query) {
        studentTbody.innerHTML = "";
        if (isAdminVisible) adminTbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-indigo-400 italic">Search for a project to manage.</td></tr>`;
        return;
    }

    const filtered = allProjects.filter(p => p.id.toString() === query || p.title.toLowerCase().includes(query));

    if (filtered.length === 0) {
        const msg = `<tr><td colspan="4" class="p-8 text-center text-red-500 font-bold">No results found for "${query}"</td></tr>`;
        studentTbody.innerHTML = msg;
        if (isAdminVisible) adminTbody.innerHTML = msg;
        return;
    }

    const statusNames = ["Pending", "Approved", "Rejected"];
    const statusColors = ["text-orange-600", "text-[#10B981]", "text-red-600"];
    const statusBg = ["bg-orange-50", "bg-[#ECFDF5]", "bg-red-50"];

    // Student Rendering
    studentTbody.innerHTML = filtered.map(p => `
        <tr class="group hover:bg-slate-50 transition-all border-b border-slate-50">
            <td class="px-6 py-8 text-[#10B981] font-bold">#${p.id}</td>
            <td class="px-6 py-8 text-slate-800 font-black text-lg">${p.title}</td>
            <td class="px-6 py-8">
                <span class="px-6 py-2 rounded-full text-xs font-bold border ${statusBg[p.status]} ${statusColors[p.status]}">
                    ${statusNames[p.status]}
                </span>
            </td>
            <td class="px-6 py-8 text-right text-slate-400 italic text-sm">${p.timestamp}</td>
        </tr>`).join("");

    // Admin Rendering (Matches image_ca01e0.png)
    if (isAdminVisible) {
        adminTbody.innerHTML = filtered.map(p => {
            const isDisabled = p.status !== 0 ? "disabled opacity-50 cursor-not-allowed" : "";
            return `
            <tr class="hover:bg-indigo-50/30 transition-all">
                <td class="px-8 py-6 font-bold">#${p.id}</td>
                <td class="px-8 py-6 font-black">${p.title}</td>
                <td class="px-8 py-6 font-bold ${statusColors[p.status]}">${statusNames[p.status]}</td>
                <td class="px-8 py-6 text-center"> 
                    <div class="flex gap-2 justify-center">
                        <button onclick="updateStatus(${p.id}, 1)" ${isDisabled} 
                            class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 transition-all active:scale-95 ${isDisabled}">
                            Approve
                        </button>
                        <button onclick="updateStatus(${p.id}, 2)" ${isDisabled} 
                            class="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-red-100 transition-all active:scale-95 ${isDisabled}">
                            Reject
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join("");
    }
}

/* ========= 5. TRANSACTIONS ========= */
async function submitProject() {
    const title = document.getElementById("projectTitle").value;
    const fileInput = document.getElementById("projectFile");
    if (!title || !fileInput.files[0]) return alert("Fill all fields!");

    try {
        const dummyHash = "Qm" + btoa(fileInput.files[0].name + title).substring(0, 32);
        const tx = await contract.submitProject(title, dummyHash);
        await tx.wait();
        await syncData();
        performSearch();
    } catch (err) { console.error(err); }
}

window.updateStatus = async function(id, status) {
    try {
        const tx = await contract.updateProjectStatus(id, status);
        await tx.wait();
        alert("Status updated on Blockchain!");
        await syncData();
        performSearch(); 
    } catch (err) { alert("Error: " + err.message); }
};

async function fetchIndividualProject() { 
    const id = document.getElementById("searchId").value;
    const display = document.getElementById("resultDisplay");
    if (!id) return;
    try {
        const p = await contract.getProject(id);
        document.getElementById("resTitle").innerText = p.title;
        document.getElementById("resHash").innerText = p.projectHash.slice(0, 20) + "...";
        const statusSpan = document.getElementById("resStatus");
        statusSpan.innerText = ["Pending", "Approved", "Rejected"][p.status];
        statusSpan.className = `font-bold ${["text-orange-500", "text-emerald-500", "text-red-500"][p.status]}`;
        display.classList.remove("hidden");
    } catch (err) { alert("Project ID not found."); }
}

/* ========= 6. INITIALIZATION ========= */
window.addEventListener('load', () => {
    document.getElementById("connectWallet").onclick = connectWallet;
    document.getElementById("submitBtn").onclick = submitProject;
    document.getElementById("dashboardSearchBtn").onclick = performSearch;
    document.getElementById("searchBtn").onclick = fetchIndividualProject;
    
    document.getElementById("dashboardResetBtn").onclick = () => {
        document.getElementById("dashboardSearch").value = "";
        performSearch();
    };
});