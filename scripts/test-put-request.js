// Este script testa uma requisição PUT para a API
const fetch = require("node-fetch")

async function testPutRequest() {
  const url = "http://localhost:3000/api/test-put"
  const token = "seu_token_aqui" // Substitua pelo seu token real

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Test Webhook",
        events: ["contact.created"],
      }),
    })

    const data = await response.json()
    console.log("Status:", response.status)
    console.log("Response:", data)
  } catch (error) {
    console.error("Error:", error)
  }
}

testPutRequest()
