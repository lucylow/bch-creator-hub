#!/bin/bash
# start.sh - Docker Compose management script for BCH Paywall Router

set -e

case "$1" in
  up)
    echo "Starting BCH Paywall Router services..."
    docker-compose up -d
    echo ""
    echo "Services starting..."
    echo "Backend API: http://localhost:3001"
    echo "Frontend: http://localhost:3000 (if frontend-dev profile enabled)"
    echo ""
    echo "To view logs: docker-compose logs -f [service-name]"
    echo "To view all logs: docker-compose logs -f"
    ;;
    
  down)
    echo "Stopping BCH Paywall Router services..."
    docker-compose down
    ;;
    
  reset)
    echo "Resetting BCH Paywall Router (this will remove volumes)..."
    read -p "Are you sure? This will delete all data. (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
      docker-compose down -v
      docker-compose up -d
      echo "Services reset and restarted"
    else
      echo "Reset cancelled"
    fi
    ;;
    
  logs)
    if [ -z "$2" ]
    then
      docker-compose logs -f
    else
      docker-compose logs -f "$2"
    fi
    ;;
    
  build)
    echo "Building Docker images..."
    docker-compose build --no-cache
    ;;
    
  ps)
    docker-compose ps
    ;;
    
  testnet)
    echo "Switching to testnet configuration..."
    export BCH_NETWORK=testnet
    docker-compose down
    docker-compose up -d
    echo "Services restarted with testnet configuration"
    ;;
    
  mainnet)
    echo "⚠️  WARNING: Switching to mainnet configuration..."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
      export BCH_NETWORK=mainnet
      docker-compose down
      docker-compose up -d
      echo "Services restarted with mainnet configuration"
    else
      echo "Mainnet switch cancelled"
    fi
    ;;
    
  restart)
    if [ -z "$2" ]
    then
      echo "Restarting all services..."
      docker-compose restart
    else
      echo "Restarting service: $2"
      docker-compose restart "$2"
    fi
    ;;
    
  shell)
    if [ -z "$2" ]
    then
      echo "Usage: $0 shell [service-name]"
      echo "Available services: backend, postgres, redis"
      exit 1
    else
      docker-compose exec "$2" /bin/sh
    fi
    ;;
    
  db)
    echo "Opening PostgreSQL shell..."
    docker-compose exec postgres psql -U bch_router -d bch_paywall_router
    ;;
    
  redis)
    echo "Opening Redis CLI..."
    docker-compose exec redis redis-cli
    ;;
    
  health)
    echo "Checking service health..."
    docker-compose ps
    echo ""
    echo "Backend health check:"
    curl -f http://localhost:3001/health || echo "Backend not responding"
    ;;
    
  *)
    echo "BCH Paywall Router - Docker Compose Management"
    echo ""
    echo "Usage: $0 {command} [options]"
    echo ""
    echo "Commands:"
    echo "  up              Start all services"
    echo "  down            Stop all services"
    echo "  reset           Reset all services and volumes (⚠️  deletes data)"
    echo "  restart [svc]   Restart services (optionally specify service)"
    echo "  logs [svc]      View logs (optionally specify service)"
    echo "  build           Rebuild Docker images"
    echo "  ps              Show service status"
    echo "  testnet         Switch to testnet configuration"
    echo "  mainnet         Switch to mainnet configuration (⚠️  production)"
    echo "  shell [svc]     Open shell in service (backend, postgres, redis)"
    echo "  db              Open PostgreSQL shell"
    echo "  redis           Open Redis CLI"
    echo "  health          Check service health"
    echo ""
    echo "Examples:"
    echo "  $0 up                    # Start all services"
    echo "  $0 logs backend          # View backend logs"
    echo "  $0 shell backend         # Open shell in backend container"
    echo "  $0 restart backend       # Restart backend service"
    exit 1
    ;;
esac

