import App from './App.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Application root #app not found');
}

const app = new App({
  target,
});

export default app;
