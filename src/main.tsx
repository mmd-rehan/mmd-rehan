import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Site from './site/Site'
import './site/site.css'

const container = document.getElementById('root')!
const app = (
  <React.StrictMode>
    <Site />
  </React.StrictMode>
)

if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
