const express = require("express")
const cors = require("cors")
const connectToDB = require("./config/db")
const userRoutes = require("./routes/userRoutes")
const aiRoutes = require("./routes/aiRoutes")

const app = express()
app.use(express.json())
app.use(cors())

app.use("/api/users", userRoutes)
app.use("/api/ai", aiRoutes)
connectToDB().then(() => {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})