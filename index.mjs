import express from "express";

const PORT = 5050;
const app = express();

import grades from "./routes/grades.mjs";
import grades_agg from "./routes/grades_agg.mjs";

app.use(express.json());


const gradesSchema = {
  $jsonSchema: {
  },
};

// Find invalid documents
app.get("/", async (req, res) => {
  let collection = await db.collection("grades");

let result = await collection.find({ $nor: [gradesSchema] }).toArray();
res.send(result).status(204);
})


app.get("/", (req, res) => {
  res.send("Welcome to the API.");
});

app.use("/grades", grades);
app.use("/grades_agg", grades_agg);



// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Seems like we messed up somewhere...");
});



// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port: http://localhost:${PORT}`);
  });