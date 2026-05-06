import 'dotenv/config'

export default {
    expo: {
        name: "Project",
        slug: "project",
        version: "1.0.0",
        plugins: [
            "expo-font"
        ],
        extra:{
            SERVER_URL: process.env.SERVER_URL,
            PHONE_NUMBER: process.env.PHONE_NUMBER,
        },
        android: {
            package: "com.asphyxia.eira"
        },
        newArchEnabled: false
    }
}