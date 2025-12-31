from GMSApp.models import AccessModules, BusinessPermissions, AccessSubmodules, AccessPermissions, RolesPermissions
from django.db.models import Prefetch
from collections import defaultdict
from django.conf import settings
import logging


def fetchAllAcl():
    modules = AccessModules.objects.prefetch_related('submodules__permissions').all()
    return modules


def fetchAllBusinessAcl():    
    # Get allowed permissions for the business
    allowed_permissions = BusinessPermissions.objects.all().values_list('permission_id', flat=True)

    # Filter submodules that have at least one allowed permission
    allowed_submodules = AccessSubmodules.objects.filter(permissions__id__in=allowed_permissions).distinct()

    # Filter modules that have at least one allowed submodule
    allowed_modules = AccessModules.objects.filter(submodules__in=allowed_submodules).distinct()

    # Prefetch submodules and permissions for efficiency
    allowed_modules = allowed_modules.prefetch_related(
        Prefetch('submodules', queryset=allowed_submodules.prefetch_related(
            Prefetch('permissions', queryset=AccessPermissions.objects.filter(id__in=allowed_permissions))
        ))
    )
    
    return allowed_modules


def fetchRolesAcl(role_id):
    # Get allowed permissions for the role
    allowed_permissions = RolesPermissions.objects.filter(role_id=role_id).values_list('permission_id', flat=True)

    # Get allowed submodules
    allowed_submodules = AccessSubmodules.objects.filter(permissions__id__in=allowed_permissions).distinct()

    # Get allowed modules
    allowed_modules = AccessModules.objects.filter(submodules__in=allowed_submodules).distinct()

    # Prefetch submodules and permissions
    allowed_modules = allowed_modules.prefetch_related(
        Prefetch('submodules', queryset=allowed_submodules.prefetch_related(
            Prefetch('permissions', queryset=AccessPermissions.objects.filter(id__in=allowed_permissions))
        ))
    )

    # Create a nested dictionary structure
    acl_structure = defaultdict(lambda: defaultdict(list))

    for module in allowed_modules:
        module_name = module.name.replace(" ", "_")  # Replace spaces with underscores
        for submodule in module.submodules.all():
            submodule_name = submodule.name.replace(" ", "_")  # Replace spaces with underscores
            for permission in submodule.permissions.all():
                permission_name = permission.permission_type
                acl_structure[module_name][submodule_name].append(permission_name)

    acl_structure = dict(acl_structure)  # Convert defaultdict to normal dict for readability
    # logging.getLogger(__name__).info(f"acl_structure: {acl_structure}")
    return acl_structure