const btn = document.querySelector("button");
const tokenInput = document.querySelector("input#token");

function toHex(str) {
  return str.split("")
    .map((c) => c.charCodeAt(0).toString(16))
    .join("");
}

/**
 * Requests the user to sign the provided string via MetaMask.
 * @returns {Promise<string>} The signature in RSP format
 */
function requestUserSignString(str) {
  return new Promise((resolve, reject) => {
    const web3 = window.web3;
    if (!web3 || !web3.currentProvider || !web3.currentProvider.isMetaMask) {
      reject(new Error("MetaMask doesn't seem to be installed"));
    }
    const strHex = `0x${toHex(str)}`;
    if (!web3.eth.defaultAccount) {
      reject(new Error('Please log in to MetaMask'));
    } else {
      web3.personal.sign(strHex, web3.eth.defaultAccount, (err, signature) =>
        err ? reject(err) : resolve(signature));
    }
  });
}


async function sendData(token) {
  const signature = await requestUserSignString(token);
  const res = await fetch("/saveToken", {
    method: "POST",
  	headers: { authorization: `bearer ${token}:${signature}` }
  })
  return res.ok;
}

async function handleSendInfo() {
  tokenInput.disabled = true;
  btn.disabled = true;

  try {
  	await sendData(tokenInput.value);
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
