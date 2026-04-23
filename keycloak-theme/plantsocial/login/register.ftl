<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
<#if section = "header">
<#elseif section = "form">
    <div class="auth-page register-page">
      <div class="form-panel">
        <div class="form-wrapper">
          
          <a href="${url.loginUrl}" class="reg-logo-link">
            <img src="${url.resourcesPath}/img/logo.png" alt="Xyla" class="reg-logo">
          </a>
          
          <h1 class="reg-title">Create your account</h1>
          <p class="reg-subtitle">Join Xyla to like posts, share your garden, and connect with other plant lovers.</p>

          <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="alert alert-${message.type}">
                  <span class="message-text">${message.summary?no_esc}</span>
              </div>
          </#if>

          <form id="kc-register-form" action="${url.registrationAction}" method="post" class="keycloak-form">
            <div class="input-group">
                <label for="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" value="${(register.formData.firstName!'')}" autocomplete="given-name" class="form-input" />
            </div>

            <div class="input-group">
                <label for="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" value="${(register.formData.lastName!'')}" autocomplete="family-name" class="form-input" />
            </div>

            <div class="input-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" value="${(register.formData.username!'')}" autocomplete="username" class="form-input" />
            </div>

            <div class="input-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" value="${(register.formData.email!'')}" autocomplete="email" class="form-input" />
            </div>

            <div class="input-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" autocomplete="new-password" class="form-input" />
            </div>

            <div class="input-group">
                <label for="password-confirm">Confirm Password</label>
                <input type="password" id="password-confirm" name="password-confirm" class="form-input" />
            </div>

            <button type="submit" class="keycloak-btn">
              <span>Create account</span>
            </button>
          </form>

          <p class="auth-footer">
            Already have an account?
            <a href="${url.loginUrl}">Sign In</a>
          </p>
          
        </div>
      </div>
    </div>
</#if>
</@layout.registrationLayout>
