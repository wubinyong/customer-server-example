module.exports = {
    apps: [{
        name: "server-example-api-key",
        script: "./index.js",
        env: {
            API_KEY_NAME: "api-key-name",
            API_KEY_VALUE: "api-key-value",
        }
    }]
}