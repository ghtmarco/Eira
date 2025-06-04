import 'dotenv/config'
import { version } from 'react'

export default {
    expo: {
        name: "Project",
        slug: "project",
        version: "1.0.0",
        extra:{
            API_KEY: process.env.API_KEY,
            SERVER_URL: process.env.SERVER_URL,
            PHONE_NUMBER: process.env.PHONE_NUMBER,
        }
    }
}