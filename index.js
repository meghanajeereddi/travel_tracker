import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Meghana@2004",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  const result = await db.query("SELECT country_code,country_name FROM visited_countries");
  let countries = [];
  let countries_can_del =[];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
    countries_can_del.push(country.country_name);
  });
  return {countries,countries_can_del};
}
async function getAllCountries() {
  const result = await db.query("SELECT country_name FROM countries");
  let allcountries = [];
  result.rows.forEach((country) => {
    allcountries.push(country.country_name);
  });
  return allcountries;
}
// GET home page
app.get("/", async (req, res) => {
  const {countries,countries_can_del} = await checkVisited();
  const allcountries = await getAllCountries();
  res.render("index.ejs", { countries: countries, total: countries.length, allCountries: allcountries ,countries_can_del:countries_can_del});
});


//INSERT new country
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code,country_name FROM countries WHERE LOWER(country_name)= $1;",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    const countryname = data.country_name;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,country_name) VALUES ($1,$2)",
        [countryCode,countryname]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      const allcountries = await getAllCountries();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        allCountries:allcountries,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisited();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});
app.post("/delete", async (req, res) => {
  const countryname = req.body["country"];

  try {
    await db.query("DELETE FROM visited_countries WHERE country_name = $1", [countryname]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
    const {countries} = await checkVisited();
    const allCountries = await getAllCountries();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      allCountries: allCountries,
      error: "Failed to delete the country. Please try again.",
    });
  }
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
