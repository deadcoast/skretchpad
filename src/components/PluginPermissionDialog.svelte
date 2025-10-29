<!-- src/components/PluginPermissionDialog.svelte -->
<script lang="ts">
    interface NetworkPermission {
      DomainAllowlist?: string[];
    }
    
    interface PluginManifest {
      name: string;
      version: string;
      permissions: {
        filesystem: string;
        network: 'None' | NetworkPermission;
        commands: {
          allowlist: string[];
        };
      };
    }
    
    export let plugin: PluginManifest;
    export let onApprove: () => void;
    export let onDeny: () => void;
    
    const riskLevels: Record<'filesystem' | 'network' | 'commands' | 'ui', 'critical' | 'high' | 'low'> = {
      filesystem: 'high',
      network: 'critical',
      commands: 'critical',
      ui: 'low',
    };
    
    function getRiskColor(capability: keyof typeof riskLevels) {
      const level = riskLevels[capability];
      return level === 'critical' ? 'text-red-500' : 
             level === 'high' ? 'text-orange-500' : 
             'text-yellow-500';
    }
    
    function hasNetworkPermission(
      permission: PluginManifest['permissions']['network']
    ): permission is NetworkPermission {
      return permission !== 'None';
    }
  </script>
  
  <div class="permission-dialog glass-panel">
    <h2>Plugin Permission Request</h2>
    <p class="plugin-name">{plugin.name} v{plugin.version}</p>
    
    <div class="permissions-list">
      <h3>Requested Permissions:</h3>
      
      {#if plugin.permissions.filesystem !== 'None'}
        <div class="permission-item">
          <span class={getRiskColor('filesystem')}>⚠</span>
          <span>Filesystem Access: {plugin.permissions.filesystem}</span>
        </div>
      {/if}
      
      {#if hasNetworkPermission(plugin.permissions.network)}
        <div class="permission-item">
          <span class={getRiskColor('network')}>🔴</span>
          <span>Network Access</span>
          {#if plugin.permissions.network.DomainAllowlist}
            <ul class="domain-list">
              {#each plugin.permissions.network.DomainAllowlist as domain}
                <li>{domain}</li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
      
      {#if plugin.permissions.commands.allowlist.length > 0}
        <div class="permission-item">
          <span class={getRiskColor('commands')}>🔴</span>
          <span>Command Execution:</span>
          <code>{plugin.permissions.commands.allowlist.join(', ')}</code>
        </div>
      {/if}
    </div>
    
    <div class="actions">
      <button class="deny" on:click={onDeny}>Deny</button>
      <button class="approve" on:click={onApprove}>Allow</button>
    </div>
  </div>
