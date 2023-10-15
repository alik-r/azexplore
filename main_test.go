package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", "./test_markers.db")
	if err != nil {
		t.Fatalf("Cannot open test database: %v", err)
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
		t.Fatalf("Cannot create table: %v", err)
	}

	dummyData := []Marker{
		{"Marker1", "Contact1", "Type1", 50.049683, 19.944544},
		{"Marker2", "Contact2", "Type2", 50.060642, 19.932533},
		{"Marker3", "Contact3", "Type3", 50.067126, 19.945063},
	}

	for _, m := range dummyData {
		_, err := db.Exec("INSERT INTO markers(name, contact, type, latitude, longitude) VALUES (?, ?, ?, ?, ?)", m.Name, m.Contact, m.Type, m.Latitude, m.Longitude)
		if err != nil {
			t.Fatalf("Cannot insert test data: %v", err)
		}
	}

	return db
}

func teardownTestDB(t *testing.T, db *sql.DB) {
	db.Close()
	if err := os.Remove("./test_markers.db"); err != nil {
		t.Errorf("Error while removing test database: %v", err)
	}
}

func TestGetMarkersHandler(t *testing.T) {
	db := setupTestDB(t)
	defer teardownTestDB(t, db)

	req, err := http.NewRequest("GET", "/get_markers", nil)
	if err != nil {
		t.Fatalf("Could not create request: %v", err)
	}

	rr := httptest.NewRecorder()
	handler := getMarkersHandler(db)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var markers []Marker
	if err := json.NewDecoder(rr.Body).Decode(&markers); err != nil {
		t.Fatalf("Unable to decode response into marker slice: %v", err)
	}
}

func TestAddMarkerHandler(t *testing.T) {
	db := setupTestDB(t)
	defer teardownTestDB(t, db)

	marker := Marker{
		Name:      "Test",
		Contact:   "Test Contact",
		Type:      "Test Type",
		Latitude:  123.456,
		Longitude: 789.012,
	}

	body, err := json.Marshal(marker)
	if err != nil {
		t.Fatalf("Could not create request body: %v", err)
	}

	req, err := http.NewRequest("POST", "/add_marker", bytes.NewBuffer(body))
	if err != nil {
		t.Fatalf("Could not create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := addMarkerHandler(db)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}
}
