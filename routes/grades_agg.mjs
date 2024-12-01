import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

/**
 * It is not best practice to seperate these routes
 * like we have done here. This file was created
 * specifically for educational purposes, to contain
 * all aggregation routes in one place.
 */

/**
 * Grading Weights by Score Type:
 * - Exams: 50%
 * - Quizes: 30%
 * - Homework: 20%
 */


// http://localhost:5050/grades_agg/learner/2/avg-class

// Get the weighted average of a specified learner's grades, per class
router.get("/learner/:id/avg-class", async (req, res) => {
  let collection = await db.collection("grades");

  let result = await collection
    .aggregate([
      {
        $match: { learner_id: Number(req.params.id) },
      },
      {
        $unwind: { path: "$scores" },
      },
      {
        $group: {
          _id: "$class_id",
          quiz: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "quiz"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
          exam: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "exam"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
          homework: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "homework"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          class_id: "$_id",
          avg: {
            $sum: [
              { $multiply: [{ $avg: "$exam" }, 0.5] },
              { $multiply: [{ $avg: "$quiz" }, 0.3] },
              { $multiply: [{ $avg: "$homework" }, 0.2] },
            ],
          },
        },
      },
    ])
    .toArray();

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});


// Create a GET route at /grades/stats
// Within this route, create an aggregation pipeline that returns
// the following information:
// The number of learners with a weighted average 
// (as calculated by the existing routes) higher than 70%.
// The total number of learners.
// The percentage of learners with an average above 70% 
// (a ratio of the above two outputs).

// http://localhost:5050/grades_agg/stats

router
.route("/stats")
.get(async (req, res) => {
  let collection = await db.collection("grades");

  let result = await collection
  .aggregate([
    {
      $unwind: { path: "$scores" }
  },
  {
    $group: {
      _id: "$learner_id",
      quiz: {
        $push:
        {
          $cond: {
            if: { $eq: ["$scores.type", "quiz"] },
            then: "$scores.score", 
            else: "$$REMOVE",
          },
        },
      },
      exam: {
        $push: {
          $cond: {
            if: { $eq: ["$scores.type", "exam"] },
            then: "$scores.score", 
            else: "$$REMOVE",
          },
        },
      },
      homework: {
        $push: {
          $cond: {
            if: { $eq: ["$scores.type", "homework"] },
            then: "$scores.score", 
            else: "$$REMOVE",
          },
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      classs_id: "$_id",
      avg: {
        $sum: [
          { $multiply: [{ $avg: "$exam" }, 0.5] },
          { $multiply: [{ $avg: "$quiz" }, 0.3] },
          { $multiply: [{ $avg: "$homework" }, 0.2] },
        ],
      },
    },
  },
  {
    $match: {
      avg: {$gte: 70},
    },
  },
])
  .toArray();
  console.log(result)
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
  });



// Create a GET route at /grades/stats/:id
// Within this route, mimic the above aggregation 
// pipeline, but only for learners within a class 
// that has a class_id equal to the specified :id.
// Create a single-field index on class_id.
// Create a single-field index on learner_id.
// Create a compound index on learner_id and class_id,
//  in that order, both ascending.


// http://localhost:5050/grades_agg/stats/339
router
  .route("/stats/:id")
  .get(async (req, res) => {
    let collection = await db.collection("grades");

     // DESCENDING ORDER 
    // await collection.createIndex({ learner_id: 1, class_id: 1 });
    
    let result = await collection
      .aggregate([
        // {
        //   $match: { class_id: classId },
        // },
        {
          $match: { class_id: Number(req.params.id) },
        },
      //  {
      //    $match: { learner_id: Number(req.params.id) },
      //  },
        {
          $unwind: { path: "$scores" },
        },
        {
          $group: {
            _id: "$learner_id", 
            quiz: {
              $push: {
                $cond: {
                  if: { $eq: ["$scores.type", "quiz"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
            exam: {
              $push: {
                $cond: {
                  if: { $eq: ["$scores.type", "exam"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
            homework: {
              $push: {
                $cond: {
                  if: { $eq: ["$scores.type", "homework"] },
                  then: "$scores.score",
                  else: "$$REMOVE",
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            learner_id: "$_id", 
            avg: {
              $sum: [
                { $multiply: [{ $avg: "$exam" }, 0.5] },
                { $multiply: [{ $avg: "$quiz" }, 0.3] },
                { $multiply: [{ $avg: "$homework" }, 0.2] },
              ],
            },
          },
        },
        {
          $match: {
            avg: { $gte: 70 },
          },
        },
      ])
      .toArray();

    if (!result) {
      return res.status(404).send("Not found");
    } else {
      return res.status(200).send(result);
    }
  });


  // DESCENDING ORDER 
    const createIndexes = async () => {
    const collection = await db.collection("grades");
    await collection.createIndex({ learner_id: 1, class_id: 1 });
    // await collection.createIndex({ class_id: 1 });
    // await collection.createIndex({ learner_id: 1 });
  };
  createIndexes();


  //VALIDATION
  async() => {
  await db.createCollection("grades", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        title: "Grades Validation",
        required: ["class_id", "learner_id"],
        properties: {
          class_id: {
            bsonType: "int",
            minimum: 0,
            maximum: 300,
            description: "integer must be between 0 and 300"
          },
          learner_id: {
            bsonType: "int",
            minimum: 0,
            description: "integer must be greater than or equal to 0"
          },
        },
      },
    },
    validationAction: "warn" 
  });
  };

export default router;