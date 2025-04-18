const express = require("express");
const app = express();
const port = 8001;
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");

// MongoDB connection with error handling
const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://egr8f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  }
};

connectDB();

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 0 },
  gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
  mobile: { type: String, required: true },
});

const Person = mongoose.model("Person", personSchema);

// Database connection middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).send("Database not connected");
  }
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/person", async (req, res) => {
  try {
    const people = await Person.find({});
    res.render("index.ejs", { people });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.get("/person/new", (req, res) => {
  res.render("new.ejs");
});

app.post("/person", async (req, res) => {
  try {
    const { name, age, gender, mobile } = req.body;
    const newPerson = new Person({ name, age, gender, mobile });
    await newPerson.save();
    res.redirect("/person");
  } catch (err) {
    console.error(err);
    res.status(400).render("new.ejs", { error: err.message });
  }
});

app.get("/person/:id/edit", async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).send("Person not found");
    res.render("edit.ejs", { person });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.put("/person/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, gender, mobile } = req.body;
    const updatedPerson = await Person.findByIdAndUpdate(
      id,
      { name, age, gender, mobile },
      { new: true }
    );
    if (!updatedPerson) return res.status(404).send("Person not found");
    res.redirect("/person");
  } catch (err) {
    console.error(err);
    res.status(400).send("Bad Request");
  }
});

app.get("/person/:id/delete", async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).send("Person not found");
    res.render("delete.ejs", { person });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.delete("/person/:id", async (req, res) => {
  try {
    const deletedPerson = await Person.findByIdAndDelete(req.params.id);
    if (!deletedPerson) return res.status(404).send("Person not found");
    res.redirect("/person");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.get("/person/:id", async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).send("Person not found");
    res.render("show.ejs", { person });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});
