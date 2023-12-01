<script setup lang="ts">
  import { useOneSchemaImporter } from "../src"

  const importer = useOneSchemaImporter();

  const launchOneSchema = function () {
    importer.launch();

    importer.on('success', (data) => {
      // TODO: handle success
      console.log(data);
    });

    importer.on('cancel', () => {
      // TODO: handle cancel
    });

    importer.on('error', (error) => {
      // TODO: handle errors
      console.log(message);
    });
  };
</script>
<template>
  <button @click="launchOneSchema">Launch embed</button>
</template>

<style>
  .oneschema-iframe {
    width: 100vw;
    height: 100vh;
    border: none;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 10000; /* adjust as needed */
  }
</style> 