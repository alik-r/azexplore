package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

type Marker struct {
	Name      string  `json:"name"`
	Contact   string  `json:"contact"`
	Type      string  `json:"type"`
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lng"`
}

func setupDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./markers.db")
	if err != nil {
		return nil, err
	}

	createTableSQL := `CREATE TABLE IF NOT EXISTS markers (
		"name" TEXT,
		"contact" TEXT,
		"type" TEXT,
		"latitude" REAL,
		"longitude" REAL
		);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func addMarkerHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5500")
		w.Header().Set("Access-Control-Allow-Methods", "POST")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var m Marker
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			http.Error(w, "Bad Request", http.StatusUnprocessableEntity)
			return
		}

		_, err := db.Exec("INSERT INTO markers(name, contact, type, latitude, longitude) VALUES (?, ?, ?, ?, ?)", m.Name, m.Contact, m.Type, m.Latitude, m.Longitude)
		if err != nil {
			http.Error(w, "Failed to insert marker", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

func main() {
	db, err := setupDB()
	if err != nil {
		log.Fatal("Cannot setup database: ", err)
	}

	http.HandleFunc("/add_marker", addMarkerHandler(db))
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	fmt.Println("Server running on port 8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
