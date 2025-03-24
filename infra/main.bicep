@description('The Azure region for all resources')
param location string = resourceGroup().location

@description('Name of the Container Apps Environment')
param containerAppEnvName string = 'livekit-env'

@description('Name of the livekit-server Container App')
param livekitServerName string = 'livekit-server'

@description('Name of the livekit-agent Container App')
param livekitAgentName string = 'livekit-agent'

@description('Name of the livekit-frontend Container App')
param livekitFrontendName string = 'livekit-frontend'

@description('Content of the livekit configuration file (livekit.yaml) used by livekit-server')
param livekitConfigContent string

// ===========================================================
// Create the Container Apps Environment
// ===========================================================
resource containerEnv 'Microsoft.App/managedEnvironments@2024-10-02-preview' = {
  name: containerAppEnvName
  location: location
  properties: {
    // For a production workload, you might configure Log Analytics here.
    // In this example we keep it minimal.
  }
}

// ===========================================================
// livekit-server Container App (using a public image)
// ===========================================================
// resource livekitServer 'Microsoft.App/containerApps@2024-10-02-preview' = {
//   name: livekitServerName
//   location: location
//   properties: {
//     managedEnvironmentId: containerEnv.id
//     configuration: {
//       // Expose the service internally on port 7880.
//       ingress: {
//         external: false
//       }
//       secrets: [
//         {
//             name: 'livekit-config'
//             value: livekitConfigContent
//         }
//       ]
//     }
//     template: {
//       containers: [
//         {
//           name: 'livekit-server'
//           image: 'livekit/livekit-server:latest'
//           resources: {
//             cpu: json('0.5')
//             memory: '1.0Gi'
//           }
//           env: [
//             {
//               name: 'LIVEKIT_CONFIG'
//               secretRef: 'livekit-config'
//             }
//           ]
//         }
//       ]
//     }
//   }
// }

// ===========================================================
// livekit-agent Container App (from ACR image)
// ===========================================================
resource livekitAgent 'Microsoft.App/containerApps@2024-10-02-preview' = {
  name: livekitAgentName
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      registries: [
        {
          server: 'azureaivoicedemo.azurecr.io'
          username: 'azureaivoicedemo'
          passwordSecretRef: 'acr-password'
        }
      ]
      ingress: {
        external: false
      }
      secrets: [
        {
          name: 'acr-password'
          value: ''
        }
        {
          name: 'livekit-url'
          value: ''
        }
        {
          name: 'livekit-api-key'
          value: ''
        }
        {
          name: 'livekit-api-secret'
          value: ''
        }
        {
          name: 'openai-endpoint'
          value: ''
        }
        {
          name: 'openai-api-key'
          value: ''
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'livekit-agent'
          image: 'azureaivoicedemo.azurecr.io/livekit-agent:latest'
          resources: {
            cpu: 2
            memory: '4Gi'
          }
          env: [
            {
              name: 'LIVEKIT_URL'
              secretRef: 'livekit-url'
            }
            {
              name: 'LIVEKIT_API_KEY'
              secretRef: 'livekit-api-key'
            }
            {
              name: 'LIVEKIT_API_SECRET'
              secretRef: 'livekit-api-secret'
            }
            {
              name: 'OPENAI_ENDPOINT'
              secretRef: 'openai-endpoint'
            }
            {
              name: 'OPENAI_API_KEY'
              secretRef: 'openai-api-key'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'cache'
              mountPath: '/cache'
            }
          ]
        }
      ]
      volumes: [
        {
          name: 'cache'
          storageType: 'EmptyDir'
        }
      ]
    }
  }
}

// ===========================================================
// livekit-frontend Container App (from ACR image)
// ===========================================================
resource livekitFrontend 'Microsoft.App/containerApps@2024-10-02-preview' = {
  name: livekitFrontendName
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      registries: [
        {
          server: 'azureaivoicedemo.azurecr.io'
          username: 'azureaivoicedemo'
          passwordSecretRef: 'acr-password'
        }
      ]
      // Expose the frontend externally on port 3000.
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      secrets: [
        {
          name: 'acr-password'
          value: ''
        }
        {
          name: 'livekit-url'
          value: ''
        }
        {
          name: 'livekit-api-key'
          value: ''
        }
        {
          name: 'livekit-api-secret'
          value: ''
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'livekit-frontend'
          image: 'azureaivoicedemo.azurecr.io/livekit-frontend:latest'
            env: [
            {
              name: 'LIVEKIT_URL'
              secretRef: 'livekit-url'
            }
            {
              name: 'LIVEKIT_API_KEY'
              secretRef: 'livekit-api-key'
            }
            {
              name: 'LIVEKIT_API_SECRET'
              secretRef: 'livekit-api-secret'
            }
            ]
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
    }
  }
}

// ===========================================================
// Outputs
// ===========================================================
output livekitFrontendUrl string = 'https://${livekitFrontend.properties.configuration.ingress.fqdn}'
