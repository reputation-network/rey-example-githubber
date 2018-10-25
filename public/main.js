const btn = document.querySelector("button");
const tokenInput = document.querySelector("input#token");

function getManifest() {
  return fetch("/manifest").then((res) => res.json());
}

function requestUserWritePermission() {
  return getManifest()
    .then((manifest) => manifest.address)
    .then((writer) => window.REY.ui.requestOptInSignature({ writer }));
}

async function sendData(token, writePermission) {
  return fetch("/saveData", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, writePermission }),
  })
}

async function handleSendInfo() {
  tokenInput.disabled = true;
  btn.disabled = true;

  try {
    const token = tokenInput.value;
    const writePermission = await requestUserWritePermission();
  	await sendData(token, writePermission);
    alert('Done! You can move now to your step 3: launch the REY app');
  } catch(e) {
    alert(e);
  	console.error(e);
  } finally {
  	tokenInput.disabled = false;
  	btn.disabled = false;
  }
}

btn.addEventListener("click", handleSendInfo);
