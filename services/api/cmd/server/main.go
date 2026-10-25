package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	host := envOrDefault("API_HOST", "127.0.0.1")
	port := envOrDefault("API_PORT", "8080")
	addr := host + ":" + port

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = fmt.Fprintln(w, `{"status":"ok","service":"adlas-api"}`)
	})

	log.Printf("Adlas API listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
