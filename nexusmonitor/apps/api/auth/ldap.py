"""
LDAP / Active Directory Authentication stub.
Uses ldap3 library in full deployment to bind and query users.
"""

def authenticate_ldap_user(server_uri, bind_dn, bind_password, search_base, username, password):
    """
    Connect to LDAP server, search for username, try to bind with user's DN + password.
    Returns parsed user details if successful.
    """
    # ... ldap3.Server(server_uri)
    # ... ldap3.Connection(server, bind_dn, bind_password)
    # ... connection.search(...) -> user DN
    # ... ldap3.Connection(server, user_dn, password) -> bind() == True
    
    return {
        "email": f"{username}@company.local",
        "name": username,
        "is_authenticated": True,
        "mapped_roles": ["OPERATOR"]
    }
