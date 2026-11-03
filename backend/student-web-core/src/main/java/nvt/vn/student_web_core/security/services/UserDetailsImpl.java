package nvt.vn.student_web_core.security.services;

import com.fasterxml.jackson.annotation.JsonIgnore;
import nvt.vn.student_web_core.model.User;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import nvt.vn.student_web_core.model.AccountStatus;

import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {

    private String userId;
    private String fullName;
    private String email;

    @JsonIgnore
    private String password;
    private boolean active;

    private Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(String userId, String fullName, String email, String password, Collection<? extends GrantedAuthority> authorities, boolean active) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
        this.active = active;
    }

    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority(
                        "ROLE_" + user.getRole().name()
                )
        );

        return new UserDetailsImpl(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPassword(),
                authorities,
                user.getStatus() == AccountStatus.ACTIVE);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public @Nullable String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return userId;
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    //@Override
    //public boolean isAccountNonLocked() {
    //    return UserDetails.super.isAccountNonLocked();
    //}

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    //@Override
    //public boolean isEnabled() {
    //    return UserDetails.super.isEnabled();
    //}

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
