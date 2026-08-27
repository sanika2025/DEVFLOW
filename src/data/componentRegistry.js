export const componentRegistry = {
  // ----------------------------------------------------
  // BASIC SHAPES
  // ----------------------------------------------------
  rectangle: {
    label: "Rectangle",
    category: "Basic Shapes",
    shape: "rectangle",
    icon: "square"
  },
  rounded: {
    label: "Rounded Rectangle",
    category: "Basic Shapes",
    shape: "rounded",
    icon: "square"
  },
  circle: {
    label: "Circle",
    category: "Basic Shapes",
    shape: "circle",
    icon: "circle"
  },
  ellipse: {
    label: "Ellipse",
    category: "Basic Shapes",
    shape: "ellipse",
    icon: "circle"
  },
  diamond: {
    label: "Diamond",
    category: "Basic Shapes",
    shape: "diamond",
    icon: "square"
  },
  triangle: {
    label: "Triangle",
    category: "Basic Shapes",
    shape: "triangle",
    icon: "triangle"
  },
  hexagon: {
    label: "Hexagon",
    category: "Basic Shapes",
    shape: "hexagon",
    icon: "hexagon"
  },
  cylinder: {
    label: "Cylinder",
    category: "Basic Shapes",
    shape: "cylinder",
    icon: "database"
  },
  cloudShape: {
    label: "Cloud",
    category: "Basic Shapes",
    shape: "cloud",
    icon: "cloud"
  },
  document: {
    label: "Document",
    category: "Basic Shapes",
    shape: "document",
    icon: "fileText"
  },
  sticky: {
    label: "Sticky Note",
    category: "Basic Shapes",
    shape: "sticky",
    icon: "stickyNote"
  },
  text: {
    label: "Text",
    category: "Basic Shapes",
    shape: "text",
    icon: "type"
  },

  // ----------------------------------------------------
  // COMPUTE
  // ----------------------------------------------------
  server: {
    label: "Server",
    category: "Compute",
    shape: "rounded",
    icon: "server"
  },
  appServer: {
    label: "Application Server",
    category: "Compute",
    shape: "rounded",
    icon: "cpu"
  },
  microservice: {
    label: "Microservice",
    category: "Compute",
    shape: "hexagon",
    icon: "box"
  },
  worker: {
    label: "Worker",
    category: "Compute",
    shape: "rounded",
    icon: "cog"
  },
  container: {
    label: "Container",
    category: "Compute",
    shape: "rectangle",
    icon: "package"
  },
  lambda: {
    label: "Lambda / Function",
    category: "Compute",
    shape: "circle",
    icon: "zap"
  },

  // ----------------------------------------------------
  // NETWORK
  // ----------------------------------------------------
  client: {
    label: "Client",
    category: "Network",
    shape: "rectangle",
    icon: "user"
  },
  browser: {
    label: "Browser",
    category: "Network",
    shape: "rectangle",
    icon: "globe"
  },
  mobile: {
    label: "Mobile App",
    category: "Network",
    shape: "rounded",
    icon: "smartphone"
  },
  loadBalancer: {
    label: "Load Balancer",
    category: "Network",
    shape: "diamond",
    icon: "gitMerge"
  },
  apiGateway: {
    label: "API Gateway",
    category: "Network",
    shape: "diamond",
    icon: "doorOpen"
  },
  cdn: {
    label: "CDN",
    category: "Network",
    shape: "cloud",
    icon: "globe"
  },

  // ----------------------------------------------------
  // DATABASE / STORAGE
  // ----------------------------------------------------
  database: {
    label: "Database",
    category: "Database",
    shape: "cylinder",
    icon: "database"
  },
  sqlDatabase: {
    label: "SQL Database",
    category: "Database",
    shape: "cylinder",
    icon: "database"
  },
  postgres: {
    label: "PostgreSQL",
    category: "Database",
    shape: "cylinder",
    icon: "database"
  },
  redis: {
    label: "Redis",
    category: "Database",
    shape: "rounded",
    icon: "layers"
  },
  objectStorage: {
    label: "Object Storage",
    category: "Storage",
    shape: "cloud",
    icon: "hardDrive"
  },
  s3: {
    label: "S3 Bucket",
    category: "Storage",
    shape: "cloud",
    icon: "archive"
  },

  // ----------------------------------------------------
  // MESSAGING
  // ----------------------------------------------------
  messageQueue: {
    label: "Message Queue",
    category: "Messaging",
    shape: "rectangle",
    icon: "list"
  },
  kafka: {
    label: "Kafka",
    category: "Messaging",
    shape: "rectangle",
    icon: "activity"
  },

  // ----------------------------------------------------
  // SERVICES
  // ----------------------------------------------------
  auth: {
    label: "Authentication",
    category: "Services",
    shape: "rounded",
    icon: "lock"
  },
  payment: {
    label: "Payment Service",
    category: "Services",
    shape: "rounded",
    icon: "creditCard"
  },
  notification: {
    label: "Notification",
    category: "Services",
    shape: "rounded",
    icon: "bell"
  },
  externalApi: {
    label: "External API",
    category: "Services",
    shape: "cloud",
    icon: "plug"
  },

  // ----------------------------------------------------
  // INFRASTRUCTURE & CLOUD
  // ----------------------------------------------------
  kubernetes: {
    label: "Kubernetes",
    category: "Infrastructure",
    shape: "hexagon",
    icon: "box"
  },
  monitoring: {
    label: "Monitoring",
    category: "Infrastructure",
    shape: "rounded",
    icon: "activity"
  },
  vpc: {
    label: "VPC",
    category: "Cloud",
    shape: "container",
    icon: "cloud"
  },
  subnet: {
    label: "Subnet",
    category: "Cloud",
    shape: "container",
    icon: "network"
  }
};
