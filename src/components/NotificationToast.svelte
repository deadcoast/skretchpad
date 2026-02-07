<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { notifications } from '../lib/stores/notifications';

  $: items = $notifications;
</script>

{#if items.length > 0}
  <div class="notification-container">
    {#each items as notification (notification.id)}
      <div
        class="notification notification-{notification.type}"
        in:fly={{ y: 20, duration: 200 }}
        out:fade={{ duration: 150 }}
      >
        <span class="notification-icon">
          {#if notification.type === 'success'}
            &#10003;
          {:else if notification.type === 'error'}
            &#10007;
          {:else if notification.type === 'warning'}
            &#9888;
          {:else}
            &#8505;
          {/if}
        </span>
        <span class="notification-message">{notification.message}</span>
        {#if notification.action}
          <button
            class="notification-action"
            on:click={() => {
              notification.action?.callback();
              notifications.dismiss(notification.id);
            }}
          >
            {notification.action.label}
          </button>
        {/if}
        <button
          class="notification-dismiss"
          on:click={() => notifications.dismiss(notification.id)}
          aria-label="Dismiss"
        >
          &#10005;
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .notification-container {
    position: fixed;
    bottom: 32px;
    right: 16px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 400px;
    pointer-events: none;
  }

  .notification {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1.4;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .notification-info {
    background: rgba(60, 130, 220, 0.85);
    color: #fff;
  }

  .notification-success {
    background: rgba(40, 167, 69, 0.85);
    color: #fff;
  }

  .notification-warning {
    background: rgba(200, 155, 20, 0.85);
    color: #fff;
  }

  .notification-error {
    background: rgba(220, 53, 69, 0.85);
    color: #fff;
  }

  .notification-icon {
    flex-shrink: 0;
    font-size: 14px;
  }

  .notification-message {
    flex: 1;
    min-width: 0;
  }

  .notification-action {
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: inherit;
    padding: 3px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .notification-action:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .notification-dismiss {
    flex-shrink: 0;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 2px 4px;
    font-size: 12px;
    line-height: 1;
  }

  .notification-dismiss:hover {
    color: #fff;
  }
</style>
