const { getSecretData } = require('./lib/secrets')
const got = require('got')

exports.webhook = async (req, res) => {

    const startTime = +new Date()
    const env = process.env.ENV
    const secretData = await getSecretData(`mcls-async-api-example`)

    try {

        const data = req.body

        const authHeader = req.header('Authorization')
        const token = authHeader.match(/^Bearer\s(.*)$/i)


        if (!authHeader
            || authHeader.length === 0
            || !token
            || token.length === 0
            || (token.length > 0 && token[1] !== secretData['internal_auth_token'])) {
            res.status(401).json({ error: 'Invalid auth header sent!' })
            console.log(`Authentication failure`)
            return
        }

        if (typeof data !== 'object') {
            throw new Error('Invalid payload')
        }

        console.log(`[${env}] Got data: ${JSON.stringify(data)}`)
        const { type, id } = data

        if (type === 'stream') {
            const result = await got(`https://mls-api.mycujoo.tv/streaming/v1/streams/${id}`, {
                headers: {
                    'Authorization': `Bearer ${secretData['mcls_bearer_token']}`
                },
                responseType: 'json'
            }).json()

            const { title } = result

            console.log(`Stream ${title} has been updated!`)

        } else {
            throw new Error('Not implemented')
        }


        const totalProcessingTime = (+new Date() - startTime) / 1000

        res.status(200).json({ result: JSON.stringify(data), message: `Execution took ${totalProcessingTime} seconds` })
    } catch (e) {
        console.error(e)

        let error = 'Invalid request'

        if (env === 'development') {
            error = e.message
        }

        res.status(400).json({ result: 'ERROR', message: error })
    }
}