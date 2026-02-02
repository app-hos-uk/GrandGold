export default {
  config: {
    locales: ['en', 'ar', 'hi'],
    translations: {
      en: {
        'app.components.LeftMenu.navbrand.title': 'GrandGold CMS',
        'app.components.LeftMenu.navbrand.workplace': 'Dashboard',
        'Auth.form.welcome.title': 'Welcome to GrandGold CMS',
        'Auth.form.welcome.subtitle': 'Manage your marketplace content',
      },
    },
    theme: {
      light: {
        colors: {
          primary100: '#fef3cd',
          primary200: '#fdd835',
          primary500: '#c9a227',
          primary600: '#b38b2e',
          primary700: '#8b6914',
        },
      },
      dark: {
        colors: {
          primary100: '#3d3619',
          primary200: '#695c21',
          primary500: '#c9a227',
          primary600: '#e6b800',
          primary700: '#ffd700',
        },
      },
    },
  },
  bootstrap() {},
};
