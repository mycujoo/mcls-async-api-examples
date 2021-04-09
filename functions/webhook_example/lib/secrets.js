const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')
const secretClient = new SecretManagerServiceClient()

function isJsonString(str) {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}

const getSecretData = async (name) => {
    const project = `${process.env.GCLOUD_PROJECT}`
    const secret = `projects/${project}/secrets/${name}/versions/latest`

    const [version] = await secretClient.accessSecretVersion({
        name: secret,
    })

    if (!version) {
        throw new Error(`Secret ${secret} not found`)
    }

    const payload = version.payload.data.toString()

    if (isJsonString(payload)) {
        return JSON.parse(payload)
    }

    return payload
}

module.exports = {
    getSecretData,
}