<#-- Custom PlantSocial Login Template -->
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
<#if section = "header">
<#elseif section = "form">
    <div class="auth-page">
      <!-- Left: Brand Panel -->
      <div class="brand-panel">
        <div class="brand-bg"></div>
        <div class="brand-content">
          <img src="${url.resourcesPath}/img/logo.png" alt="Xyla" class="brand-logo">
          <h1>Cultivate your<br>community.</h1>
          <p>Share your garden journey with thousands of plant lovers around the world.</p>
        </div>
      </div>

      <!-- Right: Form Panel -->
      <div class="form-panel">
        <div class="auth-form">
          <div class="auth-header">
            <img src="${url.resourcesPath}/img/logo.png" alt="PlantSocial" class="auth-logo">
            <h2 class="auth-title">Welcome back</h2>
            <p class="auth-subtitle">Sign in securely with your PlantSocial account.</p>
          </div>

          <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="alert alert-${message.type}">
                  <span class="message-text">${message.summary?no_esc}</span>
              </div>
          </#if>

          <form id="kc-form-login" action="${url.loginAction}" method="post" class="keycloak-form">
            <div class="input-group">
                <label for="username">Username or Email</label>
                <input id="username" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off" class="form-input" />
            </div>
            
            <div class="input-group">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" autocomplete="off" class="form-input" />
            </div>

            <button type="submit" class="keycloak-btn">
              <span>Sign in with PlantSocial</span>
            </button>
          </form>

          <p class="auth-footer">
            Don't have an account?
            <a href="${url.registrationUrl}">Sign up</a>
          </p>
        </div>
      </div>
    </div>
</#if>
</@layout.registrationLayout>
