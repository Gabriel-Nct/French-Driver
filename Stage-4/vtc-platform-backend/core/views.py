from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Vue simple pour vérifier que l'API fonctionne
    """
    return Response({
        'success': True,
        'message': 'VTC Platform API is running!',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)
