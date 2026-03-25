import pytest
from apps.api.auth.dependencies import require_role
from packages.db.models.user import User, Role

@pytest.mark.asyncio
async def test_require_role_dependency():
    """Verify that the RBAC dependency block checks correctly."""
    dep = require_role(["ORG_ADMIN", "SITE_ADMIN"])
    
    user1 = User(id="1", roles=[Role(name="VIEWER")])
    user2 = User(id="2", roles=[Role(name="ORG_ADMIN")])
    user_super = User(id="root", roles=[Role(name="SUPER_ADMIN")])

    from fastapi import HTTPException
    
    with pytest.raises(HTTPException) as exc:
        await dep(current_user=user1)
    assert exc.value.status_code == 403
    
    # Should pass without exception
    res2 = await dep(current_user=user2)
    assert res2.id == "2"
    
    res_super = await dep(current_user=user_super)
    assert res_super.id == "root"
