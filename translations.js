// This file contains translations for the Resource Library
// Used with the i18n library for internationalization

const translations = {
  en: {
    // General
    app: {
      title: 'Resource Library',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      create: 'Create',
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
      done: 'Done',
      close: 'Close',
      add: 'Add',
      remove: 'Remove',
      yes: 'Yes',
      no: 'No'
    },

    // ResourceLibrary component
    library: {
      title: 'Resource Library',
      searchPlaceholder: 'Search resources...',
      addResource: 'Add Resource',
      filterLabel: 'Filters',
      sortLabel: 'Sort',
      allResources: 'All Resources',
      categoryFilter: 'Categories',
      typeFilter: 'Resource Types',
      resetFilters: 'Reset Filters',
      noResourcesFound: 'No resources found',
      tryAdjusting: 'Try adjusting your filters or search terms.',
      getStarted: 'Get started by adding your first resource.',
      sortNewest: 'Newest First',
      sortPopular: 'Most Popular',
      sortRelevant: 'Most Relevant',
      accessLevelFilter: 'Access Level',
      allAccess: 'All Resources',
      freeOnly: 'Free Only',
      premiumOnly: 'Premium Only',
      favoritesOnly: 'Favorites Only'
    },

    // Resource card
    resource: {
      download: 'Download',
      visit: 'Visit',
      rate: 'Rate & Review',
      addToFavorites: 'Add to favorites',
      removeFromFavorites: 'Remove from favorites',
      share: 'Share resource',
      addToCollection: 'Add to collection',
      premium: 'Premium',
      featured: 'Featured'
    },

    // Add resource form
    addResource: {
      title: 'Add New Resource',
      resourceName: 'Title',
      resourceType: 'Resource Type',
      category: 'Category',
      url: 'Resource URL',
      urlPlaceholder: 'https://example.com/resource',
      urlHelp: 'Enter the URL where this resource can be accessed or downloaded.',
      description: 'Description',
      tags: 'Tags',
      addTags: 'Add tags...',
      accessLevel: 'Access Level',
      allUsers: 'All Users',
      premiumOnly: 'Premium Users Only',
      createButton: 'Create Resource',
      cancelButton: 'Cancel'
    },

    // Collections
    collections: {
      title: 'Save to Collection',
      create: 'Create New Collection',
      name: 'Collection Name',
      description: 'Description',
      color: 'Color',
      createButton: 'Create Collection',
      cancelButton: 'Cancel',
      addToCollection: 'Add to Collection',
      alreadyAdded: 'Already added',
      noCollections: 'You don\'t have any collections yet. Create one below.'
    },

    // Analytics
    analytics: {
      title: 'Resource Analytics',
      views: 'Total Views',
      uniqueViewers: 'Unique Viewers',
      downloads: 'Downloads',
      avgTimeSpent: 'Avg. Time Spent',
      completionRate: 'Completion Rate',
      weeklyTrend: 'Weekly Trend',
      keyInsights: 'Key Insights',
      viewsByDay: 'Views by Day',
      aboveAverage: 'above average',
      belowAverage: 'below average',
      averagePerformance: 'This resource is performing {{performance}} compared to other resources in the same category.'
    },

    // Sharing
    sharing: {
      title: 'Share Resource',
      copy: 'Copy',
      copied: 'Copied',
      shareVia: 'Share via',
      email: 'Email',
      team: 'Team'
    },

    // Ratings & Reviews
    ratings: {
      title: 'Rate & Review',
      rateThisResource: 'Rate this resource',
      reviewPlaceholder: 'Share your thoughts on this resource (optional)',
      submitReview: 'Submit Review',
      reviews: 'Reviews',
      review: 'review',
      reviews_plural: 'reviews'
    },

    // Recommendations
    recommendations: {
      title: 'Recommended For You',
      personalRecommendations: 'Personalized Recommendations',
      trendingNow: 'Trending Now',
      matchLabel: 'match',
      recommendationSource: 'Recommendations are personalized based on your usage patterns, interests, and your organization\'s trends.'
    },

    // Export/Import
    exportImport: {
      managerTitle: 'Resource Manager',
      exportTab: 'Export',
      importTab: 'Import',
      exportDescription: 'Export resources to share with colleagues or transfer to another system. You can select specific categories or collections to export.',
      importDescription: 'Import resources from a JSON or CSV file. The system will validate the file and import compatible resources.',
      categories: 'Categories',
      collections: 'Collections',
      includeUserData: 'Include ratings, favorites, and view history',
      exportFormat: 'Export Format',
      exportButton: 'Export Resources',
      exporting: 'Exporting...',
      importButton: 'Import Resources',
      importing: 'Importing...',
      uploadLabel: 'Upload a file',
      dragDrop: 'or drag and drop',
      fileTypes: 'JSON or CSV up to 10MB',
      exportSuccess: 'Export Successful',
      exportError: 'Export Failed',
      importSuccess: 'Import Successful',
      importError: 'Import Failed',
      resourcesImported: '{{count}} resources imported successfully.',
      resourcesSkipped: '{{count}} resources skipped (duplicates).',
      resourcesErrors: '{{count}} resources had errors.'
    },

    // Tutorial
    tutorial: {
      getStarted: 'Get Started',
      skip: 'Skip',
      welcome: {
        title: 'Welcome to the Resource Library',
        description: 'This tutorial will guide you through the key features of the Resource Library. Learn how to browse, search, organize, and share resources with your team.'
      },
      browsing: {
        title: 'Browsing Resources',
        description: 'Resources are organized by categories and types. Use the sidebar to filter resources by category or type. You can also sort resources by newest, most popular, or relevance.'
      },
      details: {
        title: 'Resource Details',
        description: 'Click on any resource to view its details, download attachments, and see ratings and reviews. You can also rate resources to help others find the best content.'
      },
      collections: {
        title: 'Collections',
        description: 'Create collections to organize resources by topic, project, or any other criteria. You can save any resource to a collection for quick access later.'
      },
      analytics: {
        title: 'Analytics & Insights',
        description: 'View analytics to understand resource usage, popularity, and engagement. These insights can help you discover helpful content and track your learning progress.'
      },
      recommendations: {
        title: 'Personalized Recommendations',
        description: 'The system learns from your usage patterns to recommend relevant resources. Check the recommendations section regularly for content tailored to your interests.'
      },
      exportImport: {
        title: 'Importing & Exporting',
        description: 'Import resources from external sources or export your library for backup or sharing. The system supports JSON and CSV formats for seamless data transfer.'
      },
      skipConfirm: 'Are you sure you want to skip the tutorial? You can access it later from the help menu.'
    }
  },

  es: {
    // General
    app: {
      title: 'Biblioteca de Recursos',
      loading: 'Cargando...',
      success: 'Éxito',
      error: 'Error',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      create: 'Crear',
      submit: 'Enviar',
      back: 'Atrás',
      next: 'Siguiente',
      finish: 'Finalizar',
      done: 'Hecho',
      close: 'Cerrar',
      add: 'Añadir',
      remove: 'Eliminar',
      yes: 'Sí',
      no: 'No'
    },

    // ResourceLibrary component
    library: {
      title: 'Biblioteca de Recursos',
      searchPlaceholder: 'Buscar recursos...',
      addResource: 'Añadir Recurso',
      filterLabel: 'Filtros',
      sortLabel: 'Ordenar',
      allResources: 'Todos los Recursos',
      categoryFilter: 'Categorías',
      typeFilter: 'Tipos de Recursos',
      resetFilters: 'Restablecer Filtros',
      noResourcesFound: 'No se encontraron recursos',
      tryAdjusting: 'Intenta ajustar tus filtros o términos de búsqueda.',
      getStarted: 'Comienza añadiendo tu primer recurso.',
      sortNewest: 'Más Recientes',
      sortPopular: 'Más Populares',
      sortRelevant: 'Más Relevantes',
      accessLevelFilter: 'Nivel de Acceso',
      allAccess: 'Todos los Recursos',
      freeOnly: 'Solo Gratuitos',
      premiumOnly: 'Solo Premium',
      favoritesOnly: 'Solo Favoritos'
    },

    // Resource card
    resource: {
      download: 'Descargar',
      visit: 'Visitar',
      rate: 'Calificar y Reseñar',
      addToFavorites: 'Añadir a favoritos',
      removeFromFavorites: 'Eliminar de favoritos',
      share: 'Compartir recurso',
      addToCollection: 'Añadir a colección',
      premium: 'Premium',
      featured: 'Destacado'
    },

    // Add resource form (abbreviated)
    addResource: {
      title: 'Añadir Nuevo Recurso',
      resourceName: 'Título',
      resourceType: 'Tipo de Recurso',
      category: 'Categoría',
      url: 'URL del Recurso',
      urlPlaceholder: 'https://ejemplo.com/recurso',
      urlHelp: 'Introduce la URL donde se puede acceder o descargar este recurso.',
      description: 'Descripción',
      tags: 'Etiquetas',
      addTags: 'Añadir etiquetas...',
      accessLevel: 'Nivel de Acceso',
      allUsers: 'Todos los Usuarios',
      premiumOnly: 'Solo Usuarios Premium',
      createButton: 'Crear Recurso',
      cancelButton: 'Cancelar'
    }
    // Additional Spanish translations would follow similar pattern
  },

  fr: {
    // French translations (abbreviated)
    app: {
      title: 'Bibliothèque de Ressources',
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      create: 'Créer',
      submit: 'Soumettre',
      back: 'Retour',
      next: 'Suivant',
      finish: 'Terminer',
      done: 'Terminé',
      close: 'Fermer',
      add: 'Ajouter',
      remove: 'Supprimer',
      yes: 'Oui',
      no: 'Non'
    },

    library: {
      title: 'Bibliothèque de Ressources',
      searchPlaceholder: 'Rechercher des ressources...',
      addResource: 'Ajouter une ressource',
      filterLabel: 'Filtres',
      sortLabel: 'Trier',
      allResources: 'Toutes les ressources',
      categoryFilter: 'Catégories',
      typeFilter: 'Types de ressources',
      resetFilters: 'Réinitialiser les filtres'
      // Additional French translations would continue
    }
  },

  de: {
    // German translations (abbreviated)
    app: {
      title: 'Ressourcenbibliothek',
      loading: 'Wird geladen...',
      success: 'Erfolg',
      error: 'Fehler',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      search: 'Suchen',
      filter: 'Filter',
      sort: 'Sortieren',
      create: 'Erstellen',
      submit: 'Absenden',
      back: 'Zurück',
      next: 'Weiter',
      finish: 'Abschließen'
      // Additional German translations would continue
    }
  }
};

export default translations;
